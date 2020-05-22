const { performance } = require('perf_hooks');
// currently the only functional library that allows the use of a proxy
const request = require('request-promise');
const { JSDOM } = require('jsdom');
const { AppError } = require('../errors');
const { createLogger } = require('../logger');

const constants = require('./constants');
const errors = require('./errors');

/**
 * the crawler
 */
class Crawler {
  /**
   * @param {Object} props
   */
  constructor(props = {}) {
    // is necessary for the node to allow access to HTTPS pages
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    this.BASE_URL = 'http://www.buscacep.correios.com.br';
    this.logger = createLogger(this);

    Object.defineProperties(this, {
      _query: { enumerable: false, writable: true, value: {} },
      query: {
        enumerable: true,
        get: () => this._query,
        set: (value) => {
          if (
            // value is required and must be a object
            !(value instanceof Object) ||
            // value must have the search property
            typeof value.search !== 'string' ||
            // if value has exact, check if is valid
            (value.exact && (typeof value.exact !== 'string' || !constants.BOOLEAN_CHAR_ENUM.includes(value.exact))) ||
            // if value has similar, check if is valid
            (value.similar && (typeof value.similar !== 'string' || !constants.BOOLEAN_CHAR_ENUM.includes(value.similar))) ||
            // if value has cepType, check if is valid
            (value.cepType && (typeof value.similar !== 'string' || !constants.CEP_TYPE_ENUM.includes(value.cepType)))
          ) throw new AppError(errors.validation('query'));

          this._query = value;
        },
      },
      _proxy: { enumerable: false, writable: true },
      proxy: {
        get: () => this._proxy,
        set: (value) => {
          if (
            // if has proxy, check if is valid
            value && (typeof value !== 'string' || !constants.REGEX_PROXY.test(value))
          ) throw new AppError(errors.validation('proxy'));

          this._proxy = value;
        },
      },
    });

    /** @type {{search: String, exact: String, similar: String, cepType: String}} */
    this.query = { exact: 'S', similar: 'N', cepType: 'ALL', ...props.query };
    /** @type {String} */
    this.proxy = props.proxy;
  }

  /**
   * jsonified log for persist with kibana
   * @param {String} type
   * @param {*} body
   */
  log(type, body) {
    this.logger.info({ type: `${this.constructor.name}.${type}`, body });
  }

  /**
   * warpper for http get method
   * @param {String} url
   * @param {Object} formData
   * @return {Promise<String>}
   */
  async getPage(url, formData) {
    this.log('getPage', url);
    const page = await request.post(url, {
      headers: {
        // necessary to send data as form
        'Content-Type': 'multipart/form-data; boundary=--------------------------509180893747236908324241',
      },
      formData,
      // in some cases of constant mass queries it is necessary to use some
      // proxy to not ban the IP
      proxy: this.proxy,
      // used to force the server to send the page as gzip (so we have less
      // content to download)
      gzip: true,
      // force return correct encoding
      encoding: 'latin1',
    });

    return page;
  }

  /**
   * @param {Number} max
   * @return {Number[]}
   */
  buildChunks(max = 0) {
    const chunks = [];

    while (max > 0) {
      chunks.push(max > Crawler.PAGINATION ?
        Crawler.PAGINATION :
        Crawler.PAGINATION - (Crawler.PAGINATION - max));
      max -= Crawler.PAGINATION;
    }

    return chunks;
  }

  /**
   * @param {Number} startAt
   * @return {Number}
   */
  perform(startAt) {
    return (performance.now() - startAt) / 1000;
  }

  /**
   * performs the search but breaks into multiple processes as each page has
   * only {this.pagination} items
   * @return {Promise<Product[]>}
   */
  async run() {
    const startAt = performance.now();

    // need make one search to get the num of results
    let { max, ceps } = await this.getRows();

    if (max - Crawler.PAGINATION > 0) {
      const chunks = this.buildChunks(max);

      ceps = await Promise.all(chunks.map((offset, i) => {
        return i === 0 ? ceps : this.chunkProcess(i, offset * i);
      }));

      ceps = ceps.reduce((arr, list) => [...arr, ...list], []);
    }

    this.log('run', { time: this.perform(startAt) });

    return ceps;
  }

  /**
   * execute the search in one page
   * @param {Number} i
   * @param {Number} offset
   * @param {Number} limit
   * @return {Promise<Product[]>}
   */
  async chunkProcess(i = 0, offset = 0) {
    let { ceps } = await this.getRows(offset);

    // remove limit of size
    ceps = ceps.slice(0, Crawler.PAGINATION);

    this.log('chunkProcess', { chunkNumber: i, total: ceps.length });

    return ceps;
  }

  /**
   * return a list with products
   * @param {Number} offset
   * @return {Promise<{ offset: Number, max: Number, ceps: Cep[] }>}
   */
  async getRows(offset = 0) {
    const formData = {
      'relaxation': this.query.search,
      'exata': this.query.exact || 'S',
      'semelhante': this.query.similar || 'N',
      'tipoCep': this.query.cepType || 'ALL',
      'qtdrow': Crawler.PAGINATION,
      'pagini': offset + 1,
      'pagfim': offset + Crawler.PAGINATION,
    };
    const url = `${this.BASE_URL}/sistemas/buscacep/ResultadoBuscaCepEndereco.cfm`;

    // retry 3 times with scale sleep in each try
    for (let i = 0; i < 3; i++) {
      try {
        const html = await this.getPage(url, formData);

        const { document } = new JSDOM(html).window;

        const rows = [...document.querySelectorAll('.tmptabela tr')];

        const ceps = rows
          .filter((r) => !r.querySelector('th'))
          .map((r) => {
            const [place, neighborhood, locale, number] = [...r.querySelectorAll('td')]
              .map((c) => c.innerHTML.replace(/\&nbsp;/g, '').trim());
            const [city, state] = locale.split('/');
            return new Cep({ place, neighborhood, city, state, number: number.replace(/\D/g, '') });
          });

        const max = parseInt(
          // get only text around elements in control content
          [...document.querySelector('.ctrlcontent').childNodes]
            // extract text from HTMLNodes
            .map((x) => x.data).filter((x) => x)
            // remove any line break or non used space
            .join('').trim()
            // break in rest of spaces and get last element with the max num of query
            .split(' ').slice(-1),
        );


        return { offset, max, ceps };
      } catch (e) {
        debugger;
        // if throw error, ignore
      }
      setTimeout(() => null, 2 ** i * 1000);
    }
    throw new AppError(errors.fetchPage('list of products'));
  }
}

// static props
Crawler.PAGINATION = 50;

/**
 * the result of each item of list
 */
class Cep {
  /**
   * @param {{
   *  place: String,
   *  neighborhood: String,
   *  city: String,
   *  state: String,
   *  number: String
   * }} props
   */
  constructor(props = {}) {
    /** @type {String} */
    this.place = props.place;
    /** @type {String} */
    this.neighborhood = props.neighborhood;
    /** @type {String} */
    this.city = props.city;
    /** @type {String} */
    this.state = props.state;
    /** @type {String} */
    this.number = props.number;
  }
}

module.exports = {
  Crawler,
  Cep,
};

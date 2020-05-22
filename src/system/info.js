const address = require('address');
const request = require('request-promise');
const os = require('os');
const nodeDiskInfo = require('node-disk-info');

/**
 * cpu info
 */
class CpuInfo {
  /**
   * @return {Promise<CpuInfo>}
   */
  static async new() {
    return new Promise((resolve) => {
      const cores = os.cpus().length;
      const model = os.cpus()[0].model;
      const architecture = os.arch();

      const cpu = new CpuInfo({
        cores,
        model,
        architecture,
      });

      resolve(cpu);
    });
  }

  /**
   * @param {{
   *  cores: Number,
   *  model: String,
   *  architecture: String
   * }} props
   */
  constructor(props = {}) {
    /** @type {Number} */
    this.cores = props.cores;
    /** @type {String} */
    this.model = props.model;
    /** @type {String} */
    this.architecture = props.architecture;
  }
}

/**
 * memory info
 */
class MemoryInfo {
  /** @return {Promise<MemoryInfo>} */
  static async new() {
    return new Promise((resolve) => {
      const total = os.totalmem();
      const percent = os.freemem() / total * 100;

      const memory = new MemoryInfo({
        total,
        percent,
      });

      resolve(memory);
    });
  }

  /**
   * @param {{
   *  total: Number,
   *  percent: Number
   * }} props
   */
  constructor(props = {}) {
    /** @type {Number} */
    this.total = props.total;
    /** @type {Number} */
    this.percent = props.percent;
  }
}

/**
 * disk info
 */
class DiskInfo {
  /** @return {Promise<DiskInfo>} */
  static async new() {
    return new Promise((resolve) => {
      nodeDiskInfo.getDiskInfo()
        .then((disks) => {
          const info = disks.filter((x) => x.mounted === '/')[0];
          const total = info.blocks;
          const percent = ((info.used / info.blocks) * 100);

          const disk = new DiskInfo({
            total,
            percent,
          });

          resolve(disk);
        })
        .catch((_) => resolve(null));
    });
  }

  /**
   * @param {{
   *  total: String,
   *  percent: String
   * }} props
   */
  constructor(props = {}) {
    /** @type {String} */
    this.total = props.total;
    /** @type {String} */
    this.percent = props.percent;
  }
}

/**
 * network info
 */
class NetworkInfo {
  /** @return {Promise<String>} */
  static privateIp() {
    return new Promise((resolve) => {
      const privateIp = address.ip();

      resolve(privateIp);
    });
  }

  /** @return {Promise<String>} */
  static async publicIp() {
    return new Promise(async (resolve) => {
      let publicIp = 'unknown';
      try {
        const response = await request.get('https://api.ipify.org/?format=text');

        publicIp = response.data;
      } catch (e) {
      } finally {
        resolve(publicIp);
      }
    });
  }

  /** @return {Promise<NetworkInfo>} */
  static async new() {
    return new Promise(async (resolve) => {
      const privateIp = await NetworkInfo.privateIp();
      const publicIp = await NetworkInfo.publicIp();

      const network = new NetworkInfo({
        privateIp,
        publicIp,
      });

      resolve(network);
    });
  }

  /**
   * @param {{
   *  privateIp: String,
   *  publicIp: String
   * }} props
   */
  constructor(props = {}) {
    /** @type {String} */
    this.privateIp = props.privateIp;
    /** @type {String} */
    this.publicIp = props.publicIp;
  }
}

/**
 * system info
 */
class SystemInfo {
  /** @return {String} */
  static uptime() {
    const tick = parseInt(process.uptime(), 10);
    let hours = Math.floor(tick / 3600);
    let minutes = Math.floor((tick - (hours * 3600)) / 60);
    let seconds = tick - (hours * 3600) - (minutes * 60);

    const text = [];

    if (hours) {
      if (hours < 10) hours = '0' + hours;
      text.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }

    if (minutes) {
      if (minutes < 10) minutes = '0' + minutes;
      text.push(`${minutes} minute${hours > 1 ? 's' : ''}`);
    }

    if (seconds) {
      if (seconds < 10) seconds = '0' + seconds;
      text.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return text.join(', ');
  }

  /** @return {Promise<SystemInfo>} */
  static async new() {
    return new Promise(async (resolve) => {
      const hostname = os.hostname();
      const uptime = SystemInfo.uptime();
      const platform = os.platform();
      const cpu = await CpuInfo.new();
      const disk = await DiskInfo.new();
      const memory = await MemoryInfo.new();
      const network = await NetworkInfo.new();

      const system = new SystemInfo({
        hostname,
        uptime,
        platform,
        cpu,
        disk,
        memory,
        network,
      });

      resolve(system);
    });
  }

  /**
   * @param {{
   *  hostname: String,
   *  uptime: String,
   *  platform: String,
   *  cpu: CpuInfo,
   *  disk: DiskInfo,
   *  memory: MemoryInfo,
   *  network: NetworkInfo
   * }} props
   */
  constructor(props = {}) {
    /** @type {String} */
    this.hostname = props.hostname;
    /** @type {String} */
    this.uptime = props.uptime;
    /** @type {String} */
    this.platform = props.platform;
    /** @type {CpuInfo} */
    this.cpu = props.cpu;
    /** @type {DiskInfo} */
    this.disk = props.disk;
    /** @type {MemoryInfo} */
    this.memory = props.memory;
    /** @type {NetworkInfo} */
    this.network = props.network;
  }
}

module.exports = {
  CpuInfo,
  MemoryInfo,
  DiskInfo,
  NetworkInfo,
  SystemInfo,
};

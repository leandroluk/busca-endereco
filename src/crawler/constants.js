// used to validate if some property is send
const NOT_SEND = [undefined, null];

// used to set "exact" and "similar" fields in search
const BOOLEAN_CHAR_ENUM = ['S', 'N'];

// used to set "cepType" field of search
const CEP_TYPE_ENUM = ['LOG', 'PRO', 'CPC', 'GRU', 'ALL'];

const REGEX_PROXY = /^(https?:\/\/)(?:[\w-_\.]+)(?:(\:\d{1,5})|)$/i;

module.exports = {
  NOT_SEND,
  BOOLEAN_CHAR_ENUM,
  CEP_TYPE_ENUM,
  REGEX_PROXY,
};

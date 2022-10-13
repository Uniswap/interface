'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-chains.cjs.prod.js");
} else {
  module.exports = require("./wagmi-chains.cjs.dev.js");
}

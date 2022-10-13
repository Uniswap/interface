'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-connectors-walletConnect.cjs.prod.js");
} else {
  module.exports = require("./wagmi-connectors-walletConnect.cjs.dev.js");
}

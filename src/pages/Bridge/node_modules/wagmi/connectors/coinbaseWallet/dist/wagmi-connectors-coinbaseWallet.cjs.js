'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-connectors-coinbaseWallet.cjs.prod.js");
} else {
  module.exports = require("./wagmi-connectors-coinbaseWallet.cjs.dev.js");
}

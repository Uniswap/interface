'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-connectors-metaMask.cjs.prod.js");
} else {
  module.exports = require("./wagmi-connectors-metaMask.cjs.dev.js");
}

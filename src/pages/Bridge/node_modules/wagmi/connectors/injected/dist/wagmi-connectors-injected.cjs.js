'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-connectors-injected.cjs.prod.js");
} else {
  module.exports = require("./wagmi-connectors-injected.cjs.dev.js");
}

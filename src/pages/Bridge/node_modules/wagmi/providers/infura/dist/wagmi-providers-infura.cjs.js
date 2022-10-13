'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-providers-infura.cjs.prod.js");
} else {
  module.exports = require("./wagmi-providers-infura.cjs.dev.js");
}

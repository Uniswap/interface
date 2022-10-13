'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi.cjs.prod.js");
} else {
  module.exports = require("./wagmi.cjs.dev.js");
}

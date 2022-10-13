'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-actions.cjs.prod.js");
} else {
  module.exports = require("./wagmi-actions.cjs.dev.js");
}

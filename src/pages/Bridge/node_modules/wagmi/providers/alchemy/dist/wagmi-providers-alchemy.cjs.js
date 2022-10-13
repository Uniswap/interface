'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-providers-alchemy.cjs.prod.js");
} else {
  module.exports = require("./wagmi-providers-alchemy.cjs.dev.js");
}

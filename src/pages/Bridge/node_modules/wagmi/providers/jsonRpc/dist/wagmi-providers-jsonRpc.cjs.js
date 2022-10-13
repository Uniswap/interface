'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-providers-jsonRpc.cjs.prod.js");
} else {
  module.exports = require("./wagmi-providers-jsonRpc.cjs.dev.js");
}

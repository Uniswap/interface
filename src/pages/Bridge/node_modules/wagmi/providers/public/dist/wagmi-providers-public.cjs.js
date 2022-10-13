'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./wagmi-providers-public.cjs.prod.js");
} else {
  module.exports = require("./wagmi-providers-public.cjs.dev.js");
}

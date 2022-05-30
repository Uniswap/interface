// generate instruction:
// yarn add -D react-router-sitemap babel-cli babel-preset-es2015 babel-preset-react babel-register
// add to script in package.json: "sitemap": "babel-node ./sitemap-builder.js"
// run yarn sitemap

require("babel-register")({
  presets: ["es2015", "react"]
});

const router = require('./router').default;
const Sitemap = require('react-router-sitemap').default;

(
	new Sitemap(router)
	.build('https://kyberswap.com', { limitCountPaths: 5000 })
		.save('./public/sitemap.xml', '/static/')
);

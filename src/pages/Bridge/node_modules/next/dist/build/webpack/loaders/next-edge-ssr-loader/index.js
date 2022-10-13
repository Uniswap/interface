"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = edgeSSRLoader;
var _getModuleBuildInfo = require("../get-module-build-info");
var _stringifyRequest = require("../../stringify-request");
async function edgeSSRLoader() {
    const { dev , page , buildId , absolutePagePath , absoluteAppPath , absoluteDocumentPath , absolute500Path , absoluteErrorPath , isServerComponent , stringifiedConfig , appDirLoader: appDirLoaderBase64 , pagesType , sriEnabled ,  } = this.getOptions();
    const appDirLoader = Buffer.from(appDirLoaderBase64 || "", "base64").toString();
    const isAppDir = pagesType === "app";
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.nextEdgeSSR = {
        isServerComponent: isServerComponent === "true",
        page: page,
        isAppDir
    };
    buildInfo.route = {
        page,
        absolutePagePath
    };
    const stringifiedPagePath = (0, _stringifyRequest).stringifyRequest(this, absolutePagePath);
    const stringifiedAppPath = (0, _stringifyRequest).stringifyRequest(this, absoluteAppPath);
    const stringifiedErrorPath = (0, _stringifyRequest).stringifyRequest(this, absoluteErrorPath);
    const stringifiedDocumentPath = (0, _stringifyRequest).stringifyRequest(this, absoluteDocumentPath);
    const stringified500Path = absolute500Path ? (0, _stringifyRequest).stringifyRequest(this, absolute500Path) : null;
    const pageModPath = `${appDirLoader}${stringifiedPagePath.substring(1, stringifiedPagePath.length - 1)}`;
    const transformed = `
    import { adapter, enhanceGlobals } from 'next/dist/server/web/adapter'
    import { getRender } from 'next/dist/build/webpack/loaders/next-edge-ssr-loader/render'

    import Document from ${stringifiedDocumentPath}

    enhanceGlobals()

    ${isAppDir ? `
      const appRenderToHTML = require('next/dist/server/app-render').renderToHTMLOrFlight
      const pagesRenderToHTML = null
      const pageMod = require(${JSON.stringify(pageModPath)})
    ` : `
      const appRenderToHTML = null
      const pagesRenderToHTML = require('next/dist/server/render').renderToHTML
      const pageMod = require(${stringifiedPagePath})
    `}

    const appMod = require(${stringifiedAppPath})
    const errorMod = require(${stringifiedErrorPath})
    const error500Mod = ${stringified500Path ? `require(${stringified500Path})` : "null"}

    const buildManifest = self.__BUILD_MANIFEST
    const reactLoadableManifest = self.__REACT_LOADABLE_MANIFEST
    const rscManifest = self.__RSC_MANIFEST
    const rscCssManifest = self.__RSC_CSS_MANIFEST
    const subresourceIntegrityManifest = ${sriEnabled ? "self.__SUBRESOURCE_INTEGRITY_MANIFEST" : "undefined"}

    const render = getRender({
      dev: ${dev},
      page: ${JSON.stringify(page)},
      appMod,
      pageMod,
      errorMod,
      error500Mod,
      Document,
      buildManifest,
      appRenderToHTML,
      pagesRenderToHTML,
      reactLoadableManifest,
      serverComponentManifest: ${isServerComponent} ? rscManifest : null,
      serverCSSManifest: ${isServerComponent} ? rscCssManifest : null,
      subresourceIntegrityManifest,
      config: ${stringifiedConfig},
      buildId: ${JSON.stringify(buildId)},
    })

    export const ComponentMod = pageMod

    export default function(opts) {
      return adapter({
        ...opts,
        handler: render
      })
    }`;
    return transformed;
}

//# sourceMappingURL=index.js.map
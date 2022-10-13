"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.FILE_TYPES = void 0;
var _webpackConfig = require("../../webpack-config");
var _getModuleBuildInfo = require("./get-module-build-info");
const FILE_TYPES = {
    layout: "layout",
    template: "template",
    error: "error",
    loading: "loading"
};
exports.FILE_TYPES = FILE_TYPES;
async function createTreeCodeFromPath({ pagePath , resolve , resolveParallelSegments  }) {
    const splittedPath = pagePath.split(/[\\/]/);
    const appDirPrefix = splittedPath[0];
    async function createSubtreePropsFromSegmentPath(segments) {
        const segmentPath = segments.join("/");
        // Existing tree are the children of the current segment
        const props = {};
        // We need to resolve all parallel routes in this level.
        const parallelSegments = [];
        if (segments.length === 0) {
            parallelSegments.push([
                "children",
                ""
            ]);
        } else {
            parallelSegments.push(...resolveParallelSegments(segmentPath));
        }
        for (const [parallelKey, parallelSegment] of parallelSegments){
            const parallelSegmentPath = segmentPath + "/" + parallelSegment;
            if (parallelSegment === "page") {
                const matchedPagePath = `${appDirPrefix}${parallelSegmentPath}`;
                const resolvedPagePath = await resolve(matchedPagePath);
                // Use '' for segment as it's the page. There can't be a segment called '' so this is the safest way to add it.
                props[parallelKey] = `['', {}, {layoutOrPagePath: ${JSON.stringify(resolvedPagePath)}, page: () => require(${JSON.stringify(resolvedPagePath)})}]`;
                continue;
            }
            const subtree = await createSubtreePropsFromSegmentPath([
                ...segments,
                parallelSegment, 
            ]);
            // `page` is not included here as it's added above.
            const filePaths = await Promise.all(Object.values(FILE_TYPES).map(async (file)=>{
                return [
                    file,
                    await resolve(`${appDirPrefix}${parallelSegmentPath}/${file}`), 
                ];
            }));
            props[parallelKey] = `[
        '${parallelSegment}',
        ${subtree},
        {
          ${filePaths.filter(([, filePath])=>filePath !== undefined).map(([file, filePath])=>{
                if (filePath === undefined) {
                    return "";
                }
                return `${file === FILE_TYPES.layout ? `layoutOrPagePath: '${filePath}',` : ""}${file}: () => require(${JSON.stringify(filePath)}),`;
            }).join("\n")}
        }
      ]`;
        }
        return `{
      ${Object.entries(props).map(([key, value])=>`${key}: ${value}`).join(",\n")}
    }`;
    }
    const tree = await createSubtreePropsFromSegmentPath([]);
    return `const tree = ${tree}.children;`;
}
function createAbsolutePath(appDir, pathToTurnAbsolute) {
    return pathToTurnAbsolute.replace(/^private-next-app-dir/, appDir);
}
const nextAppLoader = async function nextAppLoader() {
    const { name , appDir , appPaths , pagePath , pageExtensions  } = this.getOptions() || {};
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.route = {
        page: name.replace(/^app/, ""),
        absolutePagePath: createAbsolutePath(appDir, pagePath)
    };
    const extensions = pageExtensions.map((extension)=>`.${extension}`);
    const resolveOptions = {
        ..._webpackConfig.NODE_RESOLVE_OPTIONS,
        extensions
    };
    const resolve = this.getResolve(resolveOptions);
    const normalizedAppPaths = typeof appPaths === "string" ? [
        appPaths
    ] : appPaths || [];
    const resolveParallelSegments = (pathname)=>{
        const matched = {};
        for (const path of normalizedAppPaths){
            if (path.startsWith(pathname + "/")) {
                const restPath = path.slice(pathname.length + 1);
                const matchedSegment = restPath.split("/")[0];
                const matchedKey = matchedSegment.startsWith("@") ? matchedSegment.slice(1) : "children";
                matched[matchedKey] = matchedSegment;
            }
        }
        return Object.entries(matched);
    };
    const resolver = async (pathname)=>{
        try {
            const resolved = await resolve(this.rootContext, pathname);
            this.addDependency(resolved);
            return resolved;
        } catch (err) {
            const absolutePath = createAbsolutePath(appDir, pathname);
            for (const ext of extensions){
                const absolutePathWithExtension = `${absolutePath}${ext}`;
                this.addMissingDependency(absolutePathWithExtension);
            }
            if (err.message.includes("Can't resolve")) {
                return undefined;
            }
            throw err;
        }
    };
    const treeCode = await createTreeCodeFromPath({
        pagePath,
        resolve: resolver,
        resolveParallelSegments
    });
    const result = `
    export ${treeCode}

    export const AppRouter = require('next/dist/client/components/app-router.client.js').default
    export const LayoutRouter = require('next/dist/client/components/layout-router.client.js').default
    export const RenderFromTemplateContext = require('next/dist/client/components/render-from-template-context.client.js').default
    export const HotReloader = ${// Disable HotReloader component in production
    this.mode === "development" ? `require('next/dist/client/components/hot-reloader.client.js').default` : "null"}

    export const __next_app_webpack_require__ = __webpack_require__
  `;
    return result;
};
var _default = nextAppLoader;
exports.default = _default;

//# sourceMappingURL=next-app-loader.js.map
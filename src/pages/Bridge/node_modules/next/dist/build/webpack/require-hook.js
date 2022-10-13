"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = loadRequireHook;
function loadRequireHook(aliases = []) {
    const hookPropertyMap = new Map([
        ...aliases,
        // Use `require.resolve` explicitly to make them statically analyzable
        [
            "styled-jsx",
            require.resolve("styled-jsx")
        ],
        [
            "styled-jsx/style",
            require.resolve("styled-jsx/style")
        ], 
    ].map(([request, replacement])=>[
            request,
            replacement
        ]));
    const mod = require("module");
    const resolveFilename = mod._resolveFilename;
    mod._resolveFilename = function(request, parent, isMain, options) {
        const hookResolved = hookPropertyMap.get(request);
        if (hookResolved) request = hookResolved;
        return resolveFilename.call(mod, request, parent, isMain, options);
    };
}

//# sourceMappingURL=require-hook.js.map
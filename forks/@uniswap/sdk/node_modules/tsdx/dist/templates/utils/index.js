"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composePackageJson = (template) => ({ name, author, }) => {
    return Object.assign(Object.assign({}, template.packageJson), { name,
        author, module: `dist/${name}.esm.js` });
};

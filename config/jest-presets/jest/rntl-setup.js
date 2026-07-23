// Bumps RNTL's default 1s waitFor/findBy timeout — CI runners regularly need longer for async renders.
// Kept out of the shared setup.js: web consumers of the preset (labs/sandbox) can't transform the
// react-native Flow entrypoint that @testing-library/react-native imports. Only react-native jest
// projects (mobile, wallet) load this file via setupFilesAfterEnv.
const { configure } = require('@testing-library/react-native')

configure({ asyncUtilTimeout: 5000 })

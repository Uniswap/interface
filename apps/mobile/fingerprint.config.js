/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'PackageJsonScriptsAll', // Skip all package.json scripts
    'ExpoConfigVersions', // Skip version bumps if you want
  ],
}
module.exports = config

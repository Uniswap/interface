/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'PackageJsonScriptsAll', // Skip all package.json scripts
    // Version/build-number-only bumps don't bust the fingerprint: repacked/E2E preview
    // artifacts never ship to stores, so a version bump alone shouldn't force a ~35-min
    // native rebuild.
    'ExpoConfigVersions',
  ],
  // @expo/fingerprint does not content-hash hoisted node_modules outside the project
  // root (they come back `hash: null`), and rncore autolinking config carries no
  // package versions. That leaves two blind spots for a monorepo with bun
  // `patchedDependencies`:
  //   1. an Android-only version bump of a non-Expo RN native module
  //   2. native changes delivered via patches/ (no version change at all)
  // Both are closed by hashing the app's package.json (dependency map) and the
  // monorepo patches/ dir directly. Podfile.lock (checked in under ios/) already
  // covers iOS dependency drift.
  // Build outputs that land inside workspace packages (e.g. tsconfig.tsbuildinfo from
  // a local typecheck) are content-hashed for autolinked workspace native modules and
  // would make the fingerprint depend on whether codegen/typecheck ran. Ignore them.
  ignorePaths: ['**/*.tsbuildinfo'],
  extraSources: [
    { type: 'file', filePath: 'package.json', reasons: ['extra:mobilePackageJson'] },
    { type: 'dir', filePath: '../../patches', reasons: ['extra:monorepoPatches'] },
  ],
}
module.exports = config

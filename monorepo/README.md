# Uniswap Wallet

## 🗂 Directory Structure

### apps/

Where all app entry points should live. App specific startup instructions should live in the associated application.

### config/

Shared infrastructure packages and configurations.

### packages/

Store all product related shared packages code here. Packages should be broken down by specific product. For non-product specific code, split into separate yet widely scoped packages rather than small packages.

## TODO's

- [ ] Evaluate Turbo licensing
- [ ] Running Turbo with `--since=HEAD^1` should be refactored to select the PR's first commit hash instead
- [ ] Define standard for checksumming addresses
- [ ] Bring back husky once mobile is integrated

## Monorepo Background

This monorepo has been forked forked from [pax-k/pax-react-native-starter](https://github.com/pax-k/pax-react-native-starter/blob/main/README.md>)

This monorepo is the result of:

- initial scaffold using `npm create tamagui` (see the [docs](https://tamagui.dev/))
- getting some inspiration from `tamagui-kitchen-sync` for adding Storybook to it ([link](https://github.com/dohomi/tamagui-kitchen-sink))
- adding `turbo` as a build and task runner cache system ([link](https://turbo.build/repo))
- using `Yarn Workspaces` with plugins ([docs](https://classic.yarnpkg.com/lang/en/docs/workspaces/))
- tweaking `tsconfig.json` and `package.json` for each workspace package to glue them together nicely with TypeScript Project References and Path Aliases ([docs](https://www.typescriptlang.org/docs/handbook/project-references.html)). One useful trick was to define path aliases with the same name as the ones defied by the workspace packages; this way, the code editor will jump on click to source, instead of node_modules
- setting up `build`, `format`, `lint`, `typecheck` for each package
- overall nutting and bolting everything together

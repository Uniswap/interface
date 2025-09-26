// Simple mock for expo-blur's BlurView
// This is needed to avoid the Storybook Web compilation error related to `expo-blur`, something like:
// Module parse failed: Unexpected token (29:12)
// node_modules/expo-blur/build/BlurView.web.js 29:12
// You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
// We don't actually need to use `expo-blur` in the Web App, as we just use CSS; so, we can mock it out.

export const BlurView = (props) => <div {...props} />

export default BlurView

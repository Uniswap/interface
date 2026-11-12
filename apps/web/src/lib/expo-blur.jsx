// expo-blur's web build ships raw JSX, and the web app blurs with CSS instead, so the
// vite config (and Storybook through it) aliases the package to this plain div.

// oxlint-disable-next-line react/forbid-elements -- stand-in for a native view; keeps the props pass-through identical
export const BlurView = (props) => <div {...props} />

export default BlurView

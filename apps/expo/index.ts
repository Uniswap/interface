import { registerRootComponent } from 'expo'
// Pull in the ethers shims (BEFORE importing ethers)
// Not adding the shims will result in the `atob` function not being available
import '@ethersproject/shims'

import App from './App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)

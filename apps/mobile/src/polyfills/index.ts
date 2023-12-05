/**
 * Ethers Shims
 * https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative-security
 */

// Disable sorting imports with Prettier for this file so that it doesn't change the order
// organize-imports-ignore

// Import the crypto getRandomValues shim BEFORE ethers shims
import 'react-native-get-random-values'
// Import the the ethers shims BEFORE ethers
import '@ethersproject/shims'
// Add .at() method to Array if necessary (missing before iOS 15)
import 'src/polyfills/arrayAt'
// Import the Intl polyfills for Hermes
import 'src/polyfills/intl'

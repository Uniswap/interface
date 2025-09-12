/**
 * Ethers Shims
 * https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative-security
 */

// Import the crypto getRandomValues shim BEFORE ethers shims
import 'react-native-get-random-values'
// Import the ethers shims BEFORE ethers
import '@ethersproject/shims'
// Add .at() method to Array if necessary (missing before iOS 15)
import 'src/polyfills/arrayAt'
// Import the Intl polyfills for Hermes
import 'src/polyfills/intl'

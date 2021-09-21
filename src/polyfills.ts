/**
 * Ethers Shims
 * https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative-security
 */
// Import the crypto getRandomValues shim BEFORE ethers shims
import 'react-native-get-random-values'
// Import the the ethers shims BEFORE ethers
import '@ethersproject/shims'

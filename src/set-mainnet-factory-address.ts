import { ChainId } from 'dxswap-sdk'

if (!process.env.REACT_APP_MAINNET_FACTORY_ADDRESS) {
  throw new Error('Mainnet factory address env is required')
}
console.log('setting mainnet factory address to', process.env.REACT_APP_MAINNET_FACTORY_ADDRESS)
require('dxswap-sdk').FACTORY_ADDRESS[ChainId.MAINNET] = process.env.REACT_APP_MAINNET_FACTORY_ADDRESS

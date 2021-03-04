import { ChainId, FACTORY_ADDRESS, ROUTER_ADDRESS, DXSWAP_TOKEN_LIST_ID } from 'dxswap-sdk'

if (!process.env.REACT_APP_XDAI_FACTORY_ADDRESS || !process.env.REACT_APP_XDAI_ROUTER_ADDRESS) {
  throw new Error('Mainnet factory address env is required')
}
FACTORY_ADDRESS[ChainId.XDAI] = process.env.REACT_APP_XDAI_FACTORY_ADDRESS
console.log('xdai factory address set to', process.env.REACT_APP_XDAI_FACTORY_ADDRESS)
ROUTER_ADDRESS[ChainId.XDAI] = process.env.REACT_APP_XDAI_ROUTER_ADDRESS
console.log('xdai router address set to', process.env.REACT_APP_XDAI_ROUTER_ADDRESS)
console.log('using xdai token list with id', DXSWAP_TOKEN_LIST_ID[ChainId.XDAI])

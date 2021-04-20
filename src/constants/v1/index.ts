import { Interface } from '@ethersproject/abi'
import { ChainId } from 'quickswap-sdk'
import V1_EXCHANGE_ABI from './v1_exchange.json'
import V1_FACTORY_ABI from './v1_factory.json'

const V1_FACTORY_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MATIC]: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  [ChainId.MUMBAI]: '0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351'
}

const V1_FACTORY_INTERFACE = new Interface(V1_FACTORY_ABI)
const V1_EXCHANGE_INTERFACE = new Interface(V1_EXCHANGE_ABI)

export { V1_FACTORY_ADDRESSES, V1_FACTORY_INTERFACE, V1_FACTORY_ABI, V1_EXCHANGE_INTERFACE, V1_EXCHANGE_ABI }

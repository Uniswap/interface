import { Interface } from '@ethersproject/abi'
import { ChainId } from '../../constants'
import V1_EXCHANGE_ABI from './v1_exchange.json'
import V1_FACTORY_ABI from './v1_factory.json'

import constants from '../index';

const V1_FACTORY_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].V1_FACTORY_ADDRESS,
  [ChainId.ROPSTEN]: constants[ChainId.ROPSTEN].V1_FACTORY_ADDRESS,
  [ChainId.RINKEBY]: constants[ChainId.RINKEBY].V1_FACTORY_ADDRESS,
  [ChainId.GÖRLI]: constants[ChainId.GÖRLI].V1_FACTORY_ADDRESS,
  [ChainId.KOVAN]: constants[ChainId.KOVAN].V1_FACTORY_ADDRESS,
  [ChainId.LOCAL]: constants[ChainId.LOCAL].V1_FACTORY_ADDRESS
}

const V1_FACTORY_INTERFACE = new Interface(V1_FACTORY_ABI)
const V1_EXCHANGE_INTERFACE = new Interface(V1_EXCHANGE_ABI)

export { V1_FACTORY_ADDRESSES, V1_FACTORY_INTERFACE, V1_FACTORY_ABI, V1_EXCHANGE_INTERFACE, V1_EXCHANGE_ABI }

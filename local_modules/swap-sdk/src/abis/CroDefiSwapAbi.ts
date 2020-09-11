import CroDefiSwapPair from './CroDefiSwapPair.json'
import CroDefiSwapFactory from './CroDefiSwapFactory.json'
import CroDefiSwapERC20 from './CroDefiSwapERC20.json'
import ICroDefiSwapPair from './ICroDefiSwapPair.json'

import MainnetCroDefiSwapPair from './mainnet/CroDefiSwapPair.json'
import MainnetCroDefiSwapFactory from './mainnet/CroDefiSwapFactory.json'
import MainnetCroDefiSwapERC20 from './mainnet/CroDefiSwapERC20.json'
import MainnetICroDefiSwapPair from './mainnet/ICroDefiSwapPair.json'

export const ERC20 = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetCroDefiSwapERC20 : CroDefiSwapERC20
export const CroDefiSwapPairAbi = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetCroDefiSwapPair : CroDefiSwapPair
export const CroDefiSwapFactoryAbi = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetCroDefiSwapFactory : CroDefiSwapFactory
export const ICroDefiSwapPairInterface = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetICroDefiSwapPair : ICroDefiSwapPair

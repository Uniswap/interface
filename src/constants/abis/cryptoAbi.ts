import { Interface } from '@ethersproject/abi'
import PausableTokenABI from './PausableTokenMock.json'
import BasicStakeABI from './BasicStakeContract.json'
import CryptoRouter from './crypto_router_abi.json'
import MainnetBasicStakeABI from './mainnet/BasicStakeContract.json'
import MainnetCryptoRouter from './mainnet/crypto_router_abi.json'

const PAUSEABLE_STAKE_ABI = PausableTokenABI.abi
const BASIC_STAKE_ABI = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetBasicStakeABI.abi : BasicStakeABI.abi
const CRYPTO_ROUTER_ABI = process.env.REACT_APP_CHAIN_ID === '1' ? MainnetCryptoRouter : CryptoRouter
const BASIC_STAKE_INTERFACE = new Interface(BASIC_STAKE_ABI)
const PAUSEABLE_STAKE_INTERFACE = new Interface(PAUSEABLE_STAKE_ABI)

export { BASIC_STAKE_INTERFACE, PAUSEABLE_STAKE_INTERFACE, PAUSEABLE_STAKE_ABI, BASIC_STAKE_ABI, CRYPTO_ROUTER_ABI }

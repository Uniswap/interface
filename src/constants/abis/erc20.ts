import { Interface } from '@ethersproject/abi'
import ERC20_ABI from './erc20.json'

const ERC20_INTERFACE = new Interface(ERC20_ABI)

export default ERC20_INTERFACE

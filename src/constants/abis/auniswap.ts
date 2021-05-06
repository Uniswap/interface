import { Interface } from '@ethersproject/abi'
import AUniswap_ABI from './auniswap.json'

const AUniswap_INTERFACE = new Interface(AUniswap_ABI)

export default AUniswap_INTERFACE
export { AUniswap_ABI, AUniswap_INTERFACE }

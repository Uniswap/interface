import { Interface } from '@ethersproject/abi'
import Dragov2_ABI from './erc20.json'

const Dragov2_INTERFACE = new Interface(Dragov2_ABI)

export default Dragov2_INTERFACE
export { Dragov2_ABI }

import { Interface } from '@ethersproject/abi'

import POOL_MANAGER_ABI from './pool-manager.json'

export const POOL_MANAGER_INTERFACE = new Interface(POOL_MANAGER_ABI)

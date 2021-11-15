import type { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'

import { hooks as metaMaskHooks, metaMask } from './metaMask'
import { hooks as networkHooks, network } from './network'

export const connectors: [Connector, Web3ReactHooks][] = [
  [network, networkHooks],
  [metaMask, metaMaskHooks],
]

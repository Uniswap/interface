import { ViemClientManager } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { createViemClientFactory } from 'uniswap/src/features/providers/createViemClient'
import { defaultResolveRpcConfig } from 'uniswap/src/features/providers/resolveRpcConfig'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

const createClient = createViemClientFactory({
  resolveRpcConfig: defaultResolveRpcConfig,
  getChainInfo,
  areAddressesEqual: (a, b) =>
    areAddressesEqual({
      addressInput1: { address: a, platform: Platform.EVM },
      addressInput2: { address: b, platform: Platform.EVM },
    }),
})

export const viemClients = new ViemClientManager(createClient)

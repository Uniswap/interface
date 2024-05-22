/**
 * Ethers Provider mock for end-to-end tests.
 * Replaces `createEthersProvider.ts` when RN_SRC_EXT=e2e.js at runtime
 */
import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from 'wallet/src/constants/chains'

export function createEthersProvider(chainId) {
  if (chainId === ChainId.Mainnet) {
    const provider = new TestProvider('http://127.0.0.1:8545/', chainId)
    return provider
  }
  throw new Error(`Chain ${chainId} not available in E2E tests`)
}

class TestProvider extends JsonRpcProvider {
  async getNetwork() {
    return this._network
  }

  async getBlock(tag) {
    try {
      const block = await super.getBlock(tag)
      return block
    } catch (e) {
      if (e.reason === 'missing response') {
        throw new Error(
          'Hardhat node is not running. Start it with `yarn hardhat`. [original error: ' + e
        )
      }
      throw e
    }
  }
}

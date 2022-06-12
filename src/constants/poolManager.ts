import { ChainId } from '@celo-tools/use-contractkit'

//todo: replace Mainnet and Baklava PoolManager Addresses
export const POOL_MANAGER: Record<number, string> = {
  [ChainId.Mainnet]: '0x9Ee3600543eCcc85020D6bc77EB553d1747a65D2',
  [ChainId.Alfajores]: '0x9Ee3600543eCcc85020D6bc77EB553d1747a65D2',
}

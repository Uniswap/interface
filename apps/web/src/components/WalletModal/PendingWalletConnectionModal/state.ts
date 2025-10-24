import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

/** Wallets that require separate user consent for EVM vs SVM connections (currently just MetaMask). */
const SEPARATE_PROMPT_WALLET_IDS = new Set<string>([CONNECTION_PROVIDER_IDS.METAMASK_RDNS])

export function getWalletRequiresSeparatePrompt(walletId: string) {
  return SEPARATE_PROMPT_WALLET_IDS.has(walletId)
}

/** Tracks if user has accepted the Solana connection prompt for a wallet that requires separate user consent for EVM vs SVM connections. */
const hasAcceptedSolanaConnectionPromptAtom = atomWithStorage<boolean>('hasAcceptedSolanaConnectionPrompt', false)

export function useHasAcceptedSolanaConnectionPrompt() {
  const [hasAcceptedSolanaConnectionPrompt, setHasAcceptedSolanaConnectionPrompt] = useAtom(
    hasAcceptedSolanaConnectionPromptAtom,
  )

  return {
    hasAcceptedSolanaConnectionPrompt,
    setHasAcceptedSolanaConnectionPrompt,
  }
}

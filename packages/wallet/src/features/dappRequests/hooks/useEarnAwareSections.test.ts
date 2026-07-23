import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { deriveEarnAwareSections } from 'wallet/src/features/dappRequests/hooks/useEarnAwareSections'
import {
  type TransactionAsset,
  type TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'

const CHAIN_ID = UniverseChainId.Mainnet
const VAULT_ADDRESS = '0x1111111111111111111111111111111111111111' // ERC-4626 share token (e.g. GTUSDCP)
const USDC_ADDRESS = '0x2222222222222222222222222222222222222222' // underlying

const VAULT: EarnVaultInfo = {
  id: `${CHAIN_ID}-${VAULT_ADDRESS}`,
  currencyId: buildCurrencyId(CHAIN_ID, USDC_ADDRESS),
  displayCurrencyId: buildCurrencyId(CHAIN_ID, USDC_ADDRESS),
  vaultAddress: VAULT_ADDRESS,
  chainId: CHAIN_ID,
  apyPercent: 4.52,
  exposureCurrencyIds: [],
  totalDepositsUsd: 0,
  liquidityUsd: 0,
  curator: { name: 'Test', imageUrl: '' },
}

function asset(address: string): TransactionAsset {
  return { type: 'ERC20', address, chainId: CHAIN_ID, symbol: 'TKN', amount: '5', usdValue: '5' }
}

const sending = (address: string): TransactionSection => ({
  type: TransactionSectionType.Sending,
  assets: [asset(address)],
})
const receiving = (address: string): TransactionSection => ({
  type: TransactionSectionType.Receiving,
  assets: [asset(address)],
})
const approving = (address: string): TransactionSection => ({
  type: TransactionSectionType.Approving,
  assets: [asset(address)],
})

describe('deriveEarnAwareSections', () => {
  it('collapses a deposit (receives share token) into a Depositing section with APY, preserving the approval', () => {
    const sections = [approving(USDC_ADDRESS), sending(USDC_ADDRESS), receiving(VAULT_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [VAULT] })

    expect(result).toHaveLength(2)
    // The approval row is kept so the user still sees it.
    expect(result[0]?.type).toBe(TransactionSectionType.Approving)
    expect(result[1]?.type).toBe(TransactionSectionType.Depositing)
    expect(result[1]?.apyPercent).toBe(4.52)
    // Depositing shows the underlying being sent, not the share token received.
    expect(result[1]?.assets[0]?.address).toBe(USDC_ADDRESS)
  })

  it('collapses a deposit with no approval into a single Depositing section', () => {
    const sections = [sending(USDC_ADDRESS), receiving(VAULT_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [VAULT] })

    expect(result).toHaveLength(1)
    expect(result[0]?.type).toBe(TransactionSectionType.Depositing)
  })

  it('collapses a withdraw (sends share token) into a Withdrawing section without APY', () => {
    const sections = [sending(VAULT_ADDRESS), receiving(USDC_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [VAULT] })

    expect(result).toHaveLength(1)
    expect(result[0]?.type).toBe(TransactionSectionType.Withdrawing)
    expect(result[0]?.apyPercent).toBeUndefined()
    // Withdrawing shows the underlying being received.
    expect(result[0]?.assets[0]?.address).toBe(USDC_ADDRESS)
  })

  it('leaves non-Earn transactions untouched', () => {
    const sections = [sending(USDC_ADDRESS), receiving(USDC_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [VAULT] })

    expect(result).toBe(sections)
  })

  it('returns sections unchanged when no vaults are loaded', () => {
    const sections = [sending(USDC_ADDRESS), receiving(VAULT_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [] })

    expect(result).toBe(sections)
  })

  it('does not collapse a deposit when there is no underlying being sent', () => {
    const sections = [receiving(VAULT_ADDRESS)]

    const result = deriveEarnAwareSections({ sections, chainId: CHAIN_ID, vaults: [VAULT] })

    expect(result).toBe(sections)
  })
})

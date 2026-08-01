import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { selectVaultByShareToken } from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import {
  type TransactionAsset,
  type TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'

function getSection(sections: TransactionSection[], type: TransactionSectionType): TransactionSection | undefined {
  return sections.find((section) => section.type === type)
}

function getCurrencyIds(assets: TransactionAsset[] | undefined, chainId: UniverseChainId): string[] {
  return (assets ?? []).filter((asset) => asset.address).map((asset) => buildCurrencyId(chainId, asset.address))
}

/**
 * Pure detection: replace the generic Sending/Receiving rows with a single Earn Depositing
 * (+ Earning APY) or Withdrawing row when the asset diffs match a known vault. Any Approving
 * rows (e.g. the ERC-20 approval to the vault) are preserved so the user still sees them.
 * A deposit receives the vault's ERC-4626 share token (e.g. GTUSDCP) while sending the underlying;
 * a withdraw sends the share token and receives the underlying. Returns `sections` unchanged otherwise.
 */
export function deriveEarnAwareSections({
  sections,
  chainId,
  vaults,
}: {
  sections: TransactionSection[]
  chainId: UniverseChainId
  vaults: readonly EarnVaultInfo[]
}): TransactionSection[] {
  if (vaults.length === 0) {
    return sections
  }

  const receivingAssets = getSection(sections, TransactionSectionType.Receiving)?.assets
  const sendingAssets = getSection(sections, TransactionSectionType.Sending)?.assets
  const receivedCurrencyIds = getCurrencyIds(receivingAssets, chainId)
  const sentCurrencyIds = getCurrencyIds(sendingAssets, chainId)
  const approvingSections = sections.filter((section) => section.type === TransactionSectionType.Approving)

  // Deposit: the received token is a vault share token; the deposited asset is what's being sent.
  const depositVault = selectVaultByShareToken({ tokenCurrencyIds: receivedCurrencyIds, vaults })
  if (depositVault && sendingAssets?.length) {
    return [
      ...approvingSections,
      {
        type: TransactionSectionType.Depositing,
        assets: sendingAssets,
        apyPercent: depositVault.apyPercent,
      },
    ]
  }

  // Withdraw: the sent token is a vault share token; the withdrawn asset is what's being received.
  const withdrawVault = selectVaultByShareToken({ tokenCurrencyIds: sentCurrencyIds, vaults })
  if (withdrawVault && receivingAssets?.length) {
    return [
      ...approvingSections,
      {
        type: TransactionSectionType.Withdrawing,
        assets: receivingAssets,
      },
    ]
  }

  return sections
}

/**
 * Makes the dapp transaction-request preview Earn-aware. Gated behind the Earn feature flag and
 * limited to Earn-supported chains; fetches the vault list (vaults-only, no positions) and delegates
 * the detection to {@link deriveEarnAwareSections}.
 */
export function useEarnAwareSections({
  sections,
  chainId,
}: {
  sections: TransactionSection[]
  chainId: UniverseChainId
}): TransactionSection[] {
  const isEarnEnabled = useFeatureFlag(FeatureFlags.Earn)
  const chainSupported = EARN_SUPPORTED_CHAIN_IDS.includes(chainId)
  const enabled = isEarnEnabled && chainSupported && sections.length > 0

  // Vaults-only fetch (no account → positions query stays disabled).
  const { vaults } = useEarnVaults({ enabled })

  return useMemo(
    () => (enabled ? deriveEarnAwareSections({ sections, chainId, vaults }) : sections),
    [enabled, sections, chainId, vaults],
  )
}

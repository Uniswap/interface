import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Loader, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnInfoPopover } from 'uniswap/src/features/earn/EarnInfoPopover'
import { EarnReviewSummaryRow } from 'uniswap/src/features/earn/EarnReviewSummaryRow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

interface WithdrawReviewDetailsProps {
  balanceAfterUsd: number
  chainId: UniverseChainId
  expanded: boolean
  formatLocalFiat: (usdValue: number) => string
  networkCostLabel: string | undefined
  positionDepositedUsd: number
  vault: EarnVaultInfo
  onToggleExpanded: () => void
}

export function WithdrawReviewDetails({
  balanceAfterUsd,
  chainId,
  expanded,
  formatLocalFiat,
  networkCostLabel,
  positionDepositedUsd,
  vault,
  onToggleExpanded,
}: WithdrawReviewDetailsProps): JSX.Element {
  const { t } = useTranslation()
  const chainLabel = getChainInfo(chainId).label
  const vaultExplorerUrl = getExplorerLink({
    chainId: vault.chainId,
    data: vault.vaultAddress,
    type: ExplorerDataType.ADDRESS,
  })
  const onOpenVaultExplorer = useCallback(() => {
    openUri({ uri: vaultExplorerUrl }).catch(() => undefined)
  }, [vaultExplorerUrl])

  return (
    <>
      {/* Expanded-only rows sit above shared content so the sheet grows upward around the bottom-anchored controls. */}
      {expanded && (
        <Flex gap="$spacing12">
          <EarnReviewSummaryRow
            label={t('explore.earn.withdraw.vault')}
            value={
              <TouchableArea row alignItems="center" gap="$spacing4" onPress={onOpenVaultExplorer}>
                <Text variant="body3">{shortenAddress({ address: vault.vaultAddress })}</Text>
                <ExternalLink color="$neutral2" size="$icon.16" />
              </TouchableArea>
            }
          />
          <EarnReviewSummaryRow
            label={t('explore.earn.withdraw.yourBalance')}
            value={
              <Flex row alignItems="center" gap="$spacing6">
                <Text variant="body3" color="$neutral2">
                  {formatLocalFiat(positionDepositedUsd)}
                </Text>
                <Text variant="body3" color="$neutral2">
                  →
                </Text>
                <Text variant="body3">{formatLocalFiat(balanceAfterUsd)}</Text>
              </Flex>
            }
          />
        </Flex>
      )}

      <ExpandoRow
        isExpanded={expanded}
        label={expanded ? t('explore.earn.deposit.showLess') : t('explore.earn.deposit.showMore')}
        py="$spacing4"
        onPress={onToggleExpanded}
      />

      <Flex gap="$spacing12">
        <EarnReviewSummaryRow
          label={
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$neutral2">
                {t('explore.earn.withdraw.network')}
              </Text>
              <EarnInfoPopover
                title={t('explore.earn.withdraw.network')}
                caption={t('explore.earn.withdraw.network.tooltip')}
                modalName={ModalName.EarnWithdrawInfo}
              />
            </Flex>
          }
          value={
            <Flex row alignItems="center" gap="$spacing6">
              <NetworkLogo chainId={chainId} size={iconSizes.icon16} />
              <Text variant="body3">{chainLabel}</Text>
            </Flex>
          }
        />
        <EarnReviewSummaryRow
          label={
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$neutral2">
                {t('common.networkCost')}
              </Text>
              <EarnInfoPopover
                title={t('common.networkCost')}
                caption={t('explore.earn.review.networkCost.tooltip')}
                modalName={ModalName.NetworkFeeInfo}
              />
            </Flex>
          }
          value={
            networkCostLabel === undefined ? (
              <Loader.Box height={16} width={48} />
            ) : (
              <Text variant="body3">{networkCostLabel}</Text>
            )
          }
        />
      </Flex>
    </>
  )
}

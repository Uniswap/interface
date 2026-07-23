import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Loader, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { EarnInfoPopover } from 'uniswap/src/features/earn/EarnInfoPopover'
import { EarnReviewSummaryRow } from 'uniswap/src/features/earn/EarnReviewSummaryRow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

interface DepositReviewDetailsProps {
  balanceAfterUsd: number
  currentBalanceUsd: number
  expanded: boolean
  formatLocalFiat: (usdValue: number) => string
  formatPercent: (percent: number) => string
  networkCostLabel: string | undefined
  projectedAnnualEarningsUsd: number
  vault: EarnVaultInfo
  onToggleExpanded: () => void
}

export function DepositReviewDetails({
  balanceAfterUsd,
  currentBalanceUsd,
  expanded,
  formatLocalFiat,
  formatPercent,
  networkCostLabel,
  projectedAnnualEarningsUsd,
  vault,
  onToggleExpanded,
}: DepositReviewDetailsProps): JSX.Element {
  const { t } = useTranslation()
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
      <ExpandoRow
        isExpanded={expanded}
        label={expanded ? t('explore.earn.deposit.showLess') : t('explore.earn.deposit.showMore')}
        color="$neutral2"
        py="$spacing4"
        onPress={onToggleExpanded}
      />

      <Flex gap="$spacing12">
        {expanded && (
          <>
            <EarnReviewSummaryRow
              label={t('explore.earn.deposit.vault')}
              value={
                <TouchableArea row alignItems="center" gap="$spacing4" onPress={onOpenVaultExplorer}>
                  <Text variant="body3">{shortenAddress({ address: vault.vaultAddress })}</Text>
                  <ExternalLink color="$neutral2" size="$icon.16" />
                </TouchableArea>
              }
            />
            <EarnReviewSummaryRow
              label={t('explore.earn.deposit.yourBalance')}
              value={
                <Flex row alignItems="center" gap="$spacing6">
                  <Text variant="body3" color="$neutral2">
                    {formatLocalFiat(currentBalanceUsd)}
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    →
                  </Text>
                  <Text variant="body3">{formatLocalFiat(balanceAfterUsd)}</Text>
                </Flex>
              }
            />
          </>
        )}
        <EarnReviewSummaryRow
          label={
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$neutral2">
                {t('explore.earn.deposit.rate')}
              </Text>
              <EarnInfoPopover
                title={t('explore.earn.deposit.rate')}
                caption={t('explore.earn.deposit.rate.tooltip')}
                modalName={ModalName.EarnDepositRateInfo}
              />
            </Flex>
          }
          value={
            <Text variant="body3" color="$accent1">
              {t('explore.earn.vault.rateValue', {
                apy: formatPercent(vault.apyPercent),
              })}
            </Text>
          }
        />
        <EarnReviewSummaryRow
          label={
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$neutral2">
                {t('explore.earn.deposit.projectedEarnings')}
              </Text>
              <EarnInfoPopover
                title={t('explore.earn.deposit.projectedEarnings')}
                caption={t('explore.earn.deposit.projectedEarnings.tooltip')}
                modalName={ModalName.EarnDepositProjectedEarningsInfo}
              />
            </Flex>
          }
          value={
            <Text variant="body3" color="$statusSuccess">
              {`+${formatLocalFiat(projectedAnnualEarningsUsd)} `}
              <Text variant="body3" color="$neutral2">
                {t('explore.earn.deposit.perYear')}
              </Text>
            </Text>
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

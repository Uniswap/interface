import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea, useSporeColors } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { Pill } from 'uniswap/src/components/pill/Pill'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName, type ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

interface DepositReviewViewProps {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  amount: string
  onBack: () => void
  onClose: () => void
}

export function DepositReviewView({ vault, position, amount, onBack, onClose }: DepositReviewViewProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''

  const [expanded, setExpanded] = useState(true)
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), [])

  const parsedAmount = Number(amount) || 0
  const projectedAnnualEarnings = parsedAmount * (vault.apyPercent / 100)
  const tokenAmountLabel = formatNumberOrString({ value: parsedAmount, type: NumberType.TokenNonTx })

  const formatFiat = useCallback(
    (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard }),
    [formatNumberOrString],
  )

  const currentBalance = position?.depositedUsd ?? 0
  const balanceAfter = currentBalance + parsedAmount
  const vaultExplorerUrl = getExplorerLink({
    chainId: vault.chainId,
    data: vault.vaultAddress,
    type: ExplorerDataType.ADDRESS,
  })
  const onOpenVaultExplorer = useCallback(() => {
    openUri({ uri: vaultExplorerUrl }).catch(() => undefined)
  }, [vaultExplorerUrl])

  return (
    <Flex gap="$spacing16">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing8">
          <TouchableArea onPress={onBack}>
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
          <Text variant="subheading2" color="$neutral2">
            {t('explore.earn.deposit.youreDepositing')}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing12">
          <TouchableArea
            onPress={() => {
              // TODO(CONS-1783): wire "Get help" to the help center destination.
            }}
          >
            <Pill
              backgroundColor="$surface1"
              customBorderColor={colors.surface3.val}
              foregroundColor={colors.neutral1.val}
              icon={<MessageQuestion color="$neutral1" size="$icon.16" />}
              label={t('explore.earn.deposit.getHelp')}
              px="$spacing12"
              py="$spacing4"
              textVariant="buttonLabel4"
            />
          </TouchableArea>
          <ModalCloseIcon onClose={onClose} />
        </Flex>
      </Flex>

      <Flex alignItems="center" gap="$spacing12" py="$spacing32">
        <Text variant="heading1" color="$neutral1">
          {formatFiat(parsedAmount)}
        </Text>
        <Flex row alignItems="center" gap="$spacing8">
          <TokenLogo
            url={currencyInfo?.logoUrl}
            size={iconSizes.icon24}
            chainId={currency?.chainId}
            symbol={symbol}
            name={currency?.name}
          />
          <Text variant="body2" color="$neutral2">
            {`${tokenAmountLabel} ${symbol}`}
          </Text>
        </Flex>
      </Flex>

      <ExpandoRow
        isExpanded={expanded}
        label={expanded ? t('explore.earn.deposit.showLess') : t('explore.earn.deposit.showMore')}
        onPress={toggleExpanded}
      />

      {expanded && (
        <Flex gap="$spacing12">
          <SummaryRow
            label={t('explore.earn.deposit.vault')}
            value={
              <TouchableArea row alignItems="center" gap="$spacing4" onPress={onOpenVaultExplorer}>
                <Text variant="body3" color="$neutral1">
                  {shortenAddress({ address: vault.vaultAddress })}
                </Text>
                <ExternalLink color="$neutral2" size="$icon.16" />
              </TouchableArea>
            }
          />
          <SummaryRow
            label={t('explore.earn.deposit.yourBalance')}
            value={
              <Flex row alignItems="center" gap="$spacing6">
                <Text variant="body3" color="$neutral2">
                  {formatFiat(currentBalance)}
                </Text>
                <Text variant="body3" color="$neutral2">
                  →
                </Text>
                <Text variant="body3" color="$neutral1">
                  {formatFiat(balanceAfter)}
                </Text>
              </Flex>
            }
          />
          <SummaryRow
            label={
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  {t('explore.earn.deposit.rate')}
                </Text>
                <DepositInfoPopover
                  title={t('explore.earn.deposit.rate')}
                  caption={t('explore.earn.deposit.rate.tooltip')}
                  modalName={ModalName.EarnDepositRateInfo}
                />
              </Flex>
            }
            value={
              <Text variant="body3" color="$accent1">
                {t('explore.earn.vault.rateValue', { apy: formatPercent(vault.apyPercent) })}
              </Text>
            }
          />
          <SummaryRow
            label={
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  {t('explore.earn.deposit.projectedEarnings')}
                </Text>
                <DepositInfoPopover
                  title={t('explore.earn.deposit.projectedEarnings')}
                  caption={t('explore.earn.deposit.projectedEarnings.tooltip')}
                  modalName={ModalName.EarnDepositProjectedEarningsInfo}
                />
              </Flex>
            }
            value={
              <Text variant="body3" color="$statusSuccess">
                {`+${formatFiat(projectedAnnualEarnings)} `}
                <Text variant="body3" color="$neutral2">
                  {t('explore.earn.deposit.perYear')}
                </Text>
              </Text>
            }
          />
          <SummaryRow
            label={
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  {t('common.networkCost')}
                </Text>
                <DepositInfoPopover
                  title={t('common.networkCost')}
                  caption={t('transaction.networkCost.description')}
                  modalName={ModalName.NetworkFeeInfo}
                />
              </Flex>
            }
            value={
              <Text variant="body3" color="$neutral1">
                —
              </Text>
            }
          />
        </Flex>
      )}

      {/* TODO(CONS-1998): re-enable once earn chained actions are rebuilt on the new plan interface. */}
      <Button isDisabled py="$spacing24" variant="branded" size="large" onPress={() => undefined}>
        {t('explore.earn.deposit.cta', { symbol })}
      </Button>
    </Flex>
  )
}

function SummaryRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      {typeof label === 'string' ? (
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      ) : (
        label
      )}
      {value}
    </Flex>
  )
}

function DepositInfoPopover({
  title,
  caption,
  modalName,
}: {
  title: string
  caption: string
  modalName: ModalNameType
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <WarningInfo
      // Pass the icon directly — WarningInfo wraps it in its own TouchableArea on native.
      // Nesting another TouchableArea here would swallow the tap.
      trigger={<InfoCircleFilled color="$neutral3" size="$icon.16" />}
      modalProps={{
        title,
        caption,
        icon: <InfoCircleFilled color="$neutral2" size="$icon.24" />,
        modalName,
        severity: WarningSeverity.None,
        rejectText: t('common.button.close'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: (
          <Text variant="body4" color="$neutral1">
            {caption}
          </Text>
        ),
        placement: 'top',
      }}
    />
  )
}

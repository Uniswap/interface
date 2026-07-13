import { isMobileApp } from '@universe/environment'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Flex,
  IconButton,
  ModalCloseIcon,
  Text,
  TouchableArea,
  useIsShortMobileDevice,
  useSporeColors,
} from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { EarnInfoPopover } from 'uniswap/src/features/earn/EarnInfoPopover'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

interface DepositReviewViewProps {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  amount: string
  sourceCurrencyId: string
  onBack: () => void
  onClose: () => void
}

export function DepositReviewView({
  vault,
  position,
  amount,
  sourceCurrencyId,
  onBack,
  onClose,
}: DepositReviewViewProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()
  // Logo and chain badge follow the source (where they're depositing from), not the vault chain.
  const sourceCurrencyInfo = useCurrencyInfo(sourceCurrencyId)
  const currency = sourceCurrencyInfo?.currency
  const symbol = currency?.symbol ?? 'USDC'

  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), [])

  // amount is local fiat; convert to USD for math against depositedUsd / projected earnings.
  const localFiatToUsd = useLocalFiatToUSDConverter()
  const parsedAmountLocalFiat = Number(amount) || 0
  const parsedAmountUsd = localFiatToUsd(parsedAmountLocalFiat) ?? parsedAmountLocalFiat
  const projectedAnnualEarningsUsd = parsedAmountUsd * (vault.apyPercent / 100)

  // Convert local-fiat input to token units for the "X.XX SYMBOL" subtitle; null when no price.
  const { fiatToToken } = useFiatTokenConversion({ currency })
  const tokenAmountValue = fiatToToken(amount)
  const tokenAmountLabel =
    tokenAmountValue !== null ? formatNumberOrString({ value: tokenAmountValue, type: NumberType.TokenNonTx }) : '—'

  const formatLocalFiat = useCallback(
    (usdValue: number): string => convertFiatAmountFormatted(usdValue, NumberType.FiatStandard),
    [convertFiatAmountFormatted],
  )

  const currentBalanceUsd = position?.depositedUsd ?? 0
  const balanceAfterUsd = currentBalanceUsd + parsedAmountUsd
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
      {isMobileApp ? (
        <Text variant="subheading2" color="$neutral2" textAlign="center">
          {t('explore.earn.deposit.confirm')}
        </Text>
      ) : (
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
      )}

      <Flex alignItems="center" gap="$spacing12" py="$spacing32">
        <Text variant="heading1" color="$neutral1">
          {formatLocalFiat(parsedAmountUsd)}
        </Text>
        <Flex row alignItems="center" gap="$spacing8">
          <TokenLogo
            hideNetworkLogo
            url={sourceCurrencyInfo?.logoUrl}
            size={iconSizes.icon24}
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

      <Flex gap="$spacing12">
        {expanded && (
          <>
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
                    {formatLocalFiat(currentBalanceUsd)}
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    →
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {formatLocalFiat(balanceAfterUsd)}
                  </Text>
                </Flex>
              }
            />
          </>
        )}
        <SummaryRow
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
        <SummaryRow
          label={
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$neutral2">
                {t('common.networkCost')}
              </Text>
              <EarnInfoPopover
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

      {/* TODO(CONS-1998): re-enable once earn chained actions are rebuilt on the new plan interface. */}
      <Flex row gap="$spacing8">
        {isMobileApp && (
          <IconButton
            icon={<BackArrow />}
            emphasis="secondary"
            size={isShortMobileDevice ? 'medium' : 'large'}
            onPress={onBack}
          />
        )}
        <Button variant="branded" size="large" onPress={() => undefined}>
          {t('explore.earn.deposit.cta', { symbol })}
        </Button>
      </Flex>
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

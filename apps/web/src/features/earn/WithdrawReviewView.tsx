import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea, useSporeColors } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import type { MockEarnVault } from '~/features/earn/_fixtures/vaults'

// TODO(CONS-1787): replace with dynamic gas estimate from withdraw quote.
const NETWORK_COST_USD = 1.05

interface WithdrawReviewViewProps {
  vault: MockEarnVault
  amount: string
  chainId: UniverseChainId
  onBack: () => void
  onClose: () => void
  onWithdraw: () => void
}

export function WithdrawReviewView({
  vault,
  amount,
  chainId,
  onBack,
  onClose,
  onWithdraw,
}: WithdrawReviewViewProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? 'USDC'

  const [expanded, setExpanded] = useState(true)
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), [])

  const parsedAmount = Number(amount) || 0
  const tokenAmountLabel = formatNumberOrString({ value: parsedAmount, type: NumberType.TokenNonTx })

  const formatFiat = useCallback(
    (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard }),
    [formatNumberOrString],
  )

  const chainLabel = getChainInfo(chainId).label

  return (
    <Flex gap="$spacing16">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing8">
          <TouchableArea onPress={onBack}>
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
          <Text variant="subheading2" color="$neutral2">
            {t('explore.earn.withdraw.youreWithdrawing')}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing12">
          <TouchableArea
            onPress={() => {
              // TODO(CONS-1787): wire "Get help" to the help center destination.
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
            label={t('explore.earn.withdraw.to')}
            value={
              <Flex row alignItems="center" gap="$spacing6">
                <ChainLogo chainId={chainId} size={iconSizes.icon16} />
                <Text variant="body3" color="$neutral1">
                  {chainLabel}
                </Text>
              </Flex>
            }
          />
          <SummaryRow
            label={t('common.networkCost')}
            value={
              <Text variant="body3" color="$neutral1">
                {formatFiat(NETWORK_COST_USD)}
              </Text>
            }
          />
        </Flex>
      )}

      <Button variant="branded" size="large" py="$spacing24" onPress={onWithdraw}>
        {t('explore.earn.withdraw.cta', { symbol })}
      </Button>
    </Flex>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {value}
    </Flex>
  )
}

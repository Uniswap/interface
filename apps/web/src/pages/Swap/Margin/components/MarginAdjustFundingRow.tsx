import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'

// The one place in the modal where funds move, so it gets the one outlined container — filled cards are
// what you control, bare rows are consequences. Always renders, in every funding state, so typing an
// amount does not shift everything below it.
const CONTAINER = {
  gap: '$spacing4',
  p: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded16',
} as const

// Funding row for the Adjust-position modal: deposit (payment chip + Max + optional cross-token
// conversion caption), withdraw (amount to wallet), or none — derived entirely from `funding`.
export function MarginAdjustFundingRow({
  funding,
  paymentToken,
  paymentLogoUrl,
  depositAmountDisplay,
  depositUsdCaption,
  hasSpendableBalance,
  conversionCaption,
  withdrawAmountDisplay,
  onOpenSelector,
  onFillMax,
}: {
  funding: AdjustFunding
  paymentToken: MarginPaymentToken
  paymentLogoUrl?: string
  depositAmountDisplay: string
  depositUsdCaption: string
  hasSpendableBalance: boolean
  conversionCaption?: string
  withdrawAmountDisplay: string
  onOpenSelector: () => void
  onFillMax: () => void
}): JSX.Element {
  const { t } = useTranslation()

  // Nothing is being paid, so there is no payment token to choose and no amount to qualify.
  if (funding.kind === 'withdraw') {
    return (
      <Flex {...CONTAINER}>
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
          <Text variant="body3" color="$neutral2">
            {t('margin.adjustPosition.willWithdraw')}
          </Text>
          <Text variant="buttonLabel3" color="$statusSuccess">
            {withdrawAmountDisplay}
          </Text>
        </Flex>
      </Flex>
    )
  }

  // Same again with nothing moving: a token selector offering to choose what to pay, when nothing is
  // being paid, is noise. It returns with the deposit row the moment the margin is raised.
  if (funding.kind !== 'deposit') {
    return (
      <Flex {...CONTAINER}>
        <Text variant="body3" color="$neutral2">
          {t('margin.adjustPosition.noFunding')}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex {...CONTAINER}>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
        <Text variant="body3" color="$neutral2">
          {t('margin.adjustPosition.depositRequired')}
        </Text>
        <TouchableArea
          px="$spacing8"
          py="$spacing6"
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
          aria-label={t('margin.payment.selector.title')}
          onPress={onOpenSelector}
        >
          <Flex row alignItems="center" gap="$spacing6">
            <TokenLogo size={20} url={paymentLogoUrl} symbol={paymentToken.symbol} chainId={paymentToken.chainId} />
            <Text variant="buttonLabel3" color="$neutral1">
              {depositAmountDisplay} {paymentToken.symbol}
            </Text>
            <RotatableChevron direction="down" size="$icon.16" color="$neutral2" />
          </Flex>
        </TouchableArea>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
        <Text variant="body4" color="$neutral2">
          {depositUsdCaption}
        </Text>
        {hasSpendableBalance ? (
          <TouchableArea onPress={onFillMax} aria-label={t('common.max')}>
            <Text variant="body4" color="$neutral2">
              {t('common.max')}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
      {conversionCaption ? (
        <Text variant="body4" color="$neutral2">
          {conversionCaption}
        </Text>
      ) : null}
    </Flex>
  )
}

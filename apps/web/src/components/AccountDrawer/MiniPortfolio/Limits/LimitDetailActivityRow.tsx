import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import {
  useOpenOffchainActivityModal,
  useOrderAmounts,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { FormatType, formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Checkbox, Flex, Image, Text, useMedia, useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

interface LimitDetailActivityRowProps {
  order: UniswapXOrderDetails
  onToggleSelect: (order: UniswapXOrderDetails) => void
  selected: boolean
}

export function LimitDetailActivityRow({ order, onToggleSelect, selected }: LimitDetailActivityRowProps) {
  const colors = useSporeColors()
  const media = useMedia()
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const { formatCurrencyAmount } = useLocalizationContext()
  const [hovered, setHovered] = useState(false)

  const amounts = useOrderAmounts(order)
  const amountsDefined = !!amounts?.inputAmount.currency && !!amounts.outputAmount.currency

  // Get currency info for logo URLs
  const inputCurrencyInfo = useCurrencyInfo(
    amounts?.inputAmount.currency ? currencyId(amounts.inputAmount.currency) : undefined,
  )
  const outputCurrencyInfo = useCurrencyInfo(
    amounts?.outputAmount.currency ? currencyId(amounts.outputAmount.currency) : undefined,
  )

  const displayPrice = useMemo(() => {
    if (!amountsDefined) {
      return undefined
    }
    const tradePrice = new Price({ baseAmount: amounts.inputAmount, quoteAmount: amounts.outputAmount })
    return tradePrice.quote(
      CurrencyAmount.fromRawAmount(
        amounts.inputAmount.currency,
        parseUnits('1', amounts.inputAmount.currency.decimals).toString(),
      ),
    )
  }, [amounts?.inputAmount, amounts?.outputAmount, amountsDefined])

  if (!amountsDefined) {
    return null
  }

  const inputLogo = inputCurrencyInfo?.logoUrl
  const outputLogo = outputCurrencyInfo?.logoUrl

  const cancelling = order.status === TransactionStatus.Cancelling
  const expiry = order.expiry

  return (
    <Flex row alignItems="center" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <PortfolioRow
        height="unset"
        justifyContent="space-between"
        {...EllipsisTamaguiStyle}
        px={0}
        left={undefined}
        title={
          cancelling ? (
            <Text variant="body4" color="$neutral2">
              <Trans i18nKey="common.pending.cancellation" />
            </Text>
          ) : expiry ? (
            <Text variant="body4" color="$neutral2">
              <Trans
                i18nKey="common.limits.expires"
                values={{
                  timestamp: formatTimestamp({
                    timestamp: expiry * 1000,
                    includeYear: true,
                    type: FormatType.Short,
                  }),
                }}
              />
            </Text>
          ) : undefined
        }
        descriptor={
          <Flex>
            <Flex row gap="$gap4" alignItems="center">
              {inputLogo && <Image src={inputLogo} height={16} width={16} borderRadius="$roundedFull" />}
              <Text variant="subheading2" color="neutral1">
                {formatCurrencyAmount({
                  value: amounts.inputAmount,
                  type: NumberType.TokenTx,
                })}{' '}
                {amounts.inputAmount.currency.symbol}
              </Text>
              <ArrowRight color={colors.neutral1.val} size="12px" />
              {outputLogo && <Image src={outputLogo} height={16} width={16} borderRadius="$roundedFull" />}
              <Text variant="subheading2" color="neutral1">
                {formatCurrencyAmount({
                  value: amounts.outputAmount,
                  type: NumberType.TokenTx,
                })}{' '}
                {amounts.outputAmount.currency.symbol}
              </Text>
            </Flex>
            {displayPrice && (
              <Text variant="body3" color="$neutral1">
                <Trans
                  i18nKey="common.limits.when"
                  values={{
                    price: formatCurrencyAmount({
                      value: displayPrice,
                      type: NumberType.TokenTx,
                    }),
                    outSymbol: amounts.outputAmount.currency.symbol,
                    inSymbol: amounts.inputAmount.currency.symbol,
                  }}
                />
              </Text>
            )}
          </Flex>
        }
        right={undefined}
        onClick={() => {
          openOffchainActivityModal(order)
        }}
      />
      {!cancelling && (
        <Checkbox
          variant="branded"
          opacity={hovered || selected || media.md ? 1 : 0}
          size="$icon.18"
          checked={selected}
          onPress={() => onToggleSelect(order)}
        />
      )}
    </Flex>
  )
}

import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import {
  useOpenOffchainActivityModal,
  useOrderAmounts,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { FormatType, formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { parseUnits } from 'ethers/lib/utils'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { Checkbox, Flex, Image, Text, useMedia, useSporeColors } from 'ui/src'
import { useFormatter } from 'utils/formatNumbers'

interface LimitDetailActivityRowProps {
  order: Activity
  onToggleSelect: (order: Activity) => void
  selected: boolean
}

export function LimitDetailActivityRow({ order, onToggleSelect, selected }: LimitDetailActivityRowProps) {
  const colors = useSporeColors()
  const media = useMedia()
  const { logos, currencies, offchainOrderDetails } = order
  const inputCurrencyInfo = useCurrencyInfo(currencies?.[0])
  const outputCurrencyInfo = useCurrencyInfo(currencies?.[1])
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const { formatReviewSwapCurrencyAmount } = useFormatter()
  const [hovered, setHovered] = useState(false)

  const amounts = useOrderAmounts(order.offchainOrderDetails)
  const amountsDefined = !!amounts?.inputAmount?.currency && !!amounts?.outputAmount?.currency

  const displayPrice = useMemo(() => {
    if (!amountsDefined) {
      return undefined
    }
    const tradePrice = new Price({ baseAmount: amounts?.inputAmount, quoteAmount: amounts?.outputAmount })
    return tradePrice.quote(
      CurrencyAmount.fromRawAmount(
        amounts.inputAmount.currency,
        parseUnits('1', amounts.inputAmount.currency.decimals).toString(),
      ),
    )
  }, [amounts?.inputAmount, amounts?.outputAmount, amountsDefined])

  if (!offchainOrderDetails || !amountsDefined) {
    return null
  }

  const inputLogo = logos?.[0] ?? inputCurrencyInfo?.logoUrl
  const outputLogo = logos?.[1] ?? outputCurrencyInfo?.logoUrl

  const cancelling = offchainOrderDetails.status === UniswapXOrderStatus.PENDING_CANCELLATION

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
          ) : offchainOrderDetails?.expiry ? (
            <Text variant="body4" color="$neutral2">
              <Trans
                i18nKey="common.limits.expires"
                values={{ timestamp: formatTimestamp(offchainOrderDetails.expiry * 1000, true, FormatType.Short) }}
              />
            </Text>
          ) : undefined
        }
        descriptor={
          <Flex>
            <Flex row gap="$gap4" alignItems="center">
              {inputLogo && <Image src={inputLogo} height={16} width={16} borderRadius="$roundedFull" />}
              <Text variant="subheading2" color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.inputAmount)} {amounts.inputAmount.currency.symbol}
              </Text>
              <ArrowRight color={colors.neutral1.val} size="12px" />
              {outputLogo && <Image src={outputLogo} height={16} width={16} borderRadius="$roundedFull" />}
              <Text variant="subheading2" color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.outputAmount)} {amounts.outputAmount.currency.symbol}
              </Text>
            </Flex>
            {displayPrice && (
              <Text variant="body3" color="$neutral1">
                <Trans
                  i18nKey="common.limits.when"
                  values={{
                    price: formatReviewSwapCurrencyAmount(displayPrice),
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
          openOffchainActivityModal(offchainOrderDetails, {
            inputLogo: inputLogo ?? undefined,
            outputLogo: outputLogo ?? undefined,
          })
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

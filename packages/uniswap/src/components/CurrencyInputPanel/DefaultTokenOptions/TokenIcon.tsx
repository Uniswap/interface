import { memo, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Flex, TouchableArea } from 'ui/src'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { logoSize, WEB_HOVER_SCALE } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/constants'
import { useSendSelectCurrencyEvent } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenOptions/useSendSelectCurrencyEvent'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isHoverable } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

const TRANSFORM = [{ translateY: -4 }, { scale: 0.95 }] as const
const GROUP_HOVER_STYLE = {
  opacity: 1,
  transform: [{ translateY: 0 }],
  scale: 1,
} as const

const TOUCHABLE_HOVER_STYLE = { backgroundColor: '$surface3Hovered', scale: WEB_HOVER_SCALE } as const

export const TokenIcon = memo(
  ({
    currencyInfo,
    index,
    numOptions,
    currencyField = CurrencyField.OUTPUT,
  }: {
    currencyInfo: CurrencyInfo
    index: number
    numOptions: number
    currencyField?: CurrencyField
  }): JSX.Element => {
    const { logoUrl, currency } = currencyInfo
    const onSelectCurrency = useOnSelectCurrency({})
    const sendSelectCurrencyEvent = useSendSelectCurrencyEvent({ currencyField })
    const animationIndex = numOptions - index - 1

    const handleOnPress = useEvent((e: GestureResponderEvent) => {
      e.stopPropagation()
      onSelectCurrency({
        currency: currencyInfo.currency,
        field: currencyField,
        allowCrossChainPair: false,
        isPreselectedAsset: true,
      })
      sendSelectCurrencyEvent({
        currencyInfo,
        position: index + 1,
        suggestion_count: numOptions || 0,
      })
    })

    const animation = useMemo(() => {
      if (!isHoverable) {
        return undefined
      }
      return get200MsAnimationDelayFromIndex(animationIndex)
    }, [animationIndex])

    const traceProperties = useMemo(() => {
      return {
        chain_id: currency.chainId,
        token_symbol: currency.symbol,
      }
    }, [currency.chainId, currency.symbol])

    return (
      <Flex
        $group-hover={isHoverable ? GROUP_HOVER_STYLE : undefined}
        opacity={isHoverable ? 0 : undefined}
        transform={isHoverable ? TRANSFORM : undefined}
        animation={animation}
      >
        <Trace logPress element={ElementName.PreselectAsset} properties={traceProperties}>
          <TouchableArea
            hoverable
            p="$spacing4"
            borderRadius="$roundedFull"
            backgroundColor="$surface3"
            hoverStyle={isHoverable ? TOUCHABLE_HOVER_STYLE : undefined}
            animation={isHoverable ? 'simple' : undefined}
            onPress={handleOnPress}
          >
            <TokenLogo url={logoUrl} symbol={currency.symbol} chainId={currency.chainId} size={logoSize} />
          </TouchableArea>
        </Trace>
      </Flex>
    )
  },
)

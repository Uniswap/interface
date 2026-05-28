import { isHoverable } from '@universe/environment'
import { memo, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Flex, TouchableArea } from 'ui/src'
import { logoSize, WEB_HOVER_SCALE } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/constants'
import { useSendSelectCurrencyEvent } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenOptions/useSendSelectCurrencyEvent'
import {
  getStaggeredGroupHoverStyle,
  HOVER_REVEAL_EXIT_TRANSITION,
  HOVER_REVEAL_TRANSFORM,
} from 'uniswap/src/components/CurrencyInputPanel/hoverStyles'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

const TOUCHABLE_HOVER_STYLE = { backgroundColor: '$surface3Hovered', scale: WEB_HOVER_SCALE } as const

// oxlint-disable-next-line react/display-name -- biome-parity: oxlint is stricter here
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

    const traceProperties = useMemo(() => {
      return {
        chain_id: currency.chainId,
        token_symbol: currency.symbol,
      }
    }, [currency.chainId, currency.symbol])

    return (
      <Flex
        $group-hover={isHoverable ? getStaggeredGroupHoverStyle(animationIndex) : undefined}
        opacity={isHoverable ? 0 : undefined}
        transform={isHoverable ? HOVER_REVEAL_TRANSFORM : undefined}
        transition={isHoverable ? HOVER_REVEAL_EXIT_TRANSITION : undefined}
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

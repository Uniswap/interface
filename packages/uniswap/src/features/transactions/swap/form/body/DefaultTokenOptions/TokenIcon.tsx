import { useCallback } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Flex, TouchableArea } from 'ui/src'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useSendSelectCurrencyEvent } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/TokenOptions/useSendSelectCurrencyEvent'
import {
  WEB_HOVER_SCALE,
  logoSize,
} from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/constants'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isHoverable } from 'utilities/src/platform'

export const TokenIcon = ({
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

  const handleOnPress = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation()
      onSelectCurrency({
        currency: currencyInfo.currency,
        field: currencyField,
        forceIsBridgePair: false,
        isPreselectedAsset: true,
      })
      sendSelectCurrencyEvent({
        currencyInfo,
        position: index + 1,
        suggestion_count: numOptions || 0,
      })
    },
    [onSelectCurrency, currencyField, sendSelectCurrencyEvent, currencyInfo, index, numOptions],
  )

  return (
    <Flex
      {...(isHoverable
        ? {
            '$group-hover': {
              opacity: 1,
              transform: [{ translateY: 0 }],
              scale: 1,
            },
            opacity: 0,
            transform: [{ translateY: -4 }, { scale: 0.95 }],
            animation: get200MsAnimationDelayFromIndex(animationIndex),
          }
        : {})}
    >
      <Trace
        logPress
        element={ElementName.PreselectAsset}
        properties={{
          chain_id: currency.chainId,
          token_symbol: currency.symbol,
        }}
      >
        <TouchableArea
          hoverable
          p="$spacing4"
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
          onPress={handleOnPress}
          {...(isHoverable
            ? {
                hoverStyle: {
                  backgroundColor: '$surface3Hovered',
                  scale: WEB_HOVER_SCALE,
                },
                animation: 'simple',
              }
            : {})}
        >
          <TokenLogo url={logoUrl} symbol={currency.symbol} chainId={currency.chainId} size={logoSize} />
        </TouchableArea>
      </Trace>
    </Flex>
  )
}

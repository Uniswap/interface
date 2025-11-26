import { useState } from 'react'
import { Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'
import { isHoverable } from 'utilities/src/platform'

export function TokenRate({ initialInverse = false }: { initialInverse?: boolean }): JSX.Element | null {
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)
  const formatter = useLocalizationContext()

  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade).trade

  if (!trade) {
    return null
  }

  return (
    <TouchableArea
      {...(isHoverable && {
        '$group-hover': {
          opacity: 1,
        },
        animation: null,
        opacity: 0,
      })}
      style={{
        // prevents highlight on double click (useless since the text changes on click anyways)
        userSelect: 'none',
      }}
      onPress={(): void => setShowInverseRate(!showInverseRate)}
    >
      <Text
        adjustsFontSizeToFit
        {...(isHoverable && {
          hoverStyle: {
            color: '$neutral1',
          },
          animation: 'simple',
        })}
        color="$neutral2"
        numberOfLines={1}
        variant="body3"
      >
        {getRateToDisplay({ formatter, trade, showInverseRate })}
      </Text>
    </TouchableArea>
  )
}

import { useState } from 'react'
import { Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'
import { isHoverable } from 'utilities/src/platform'

export function TokenRate({ initialInverse = false }: { initialInverse?: boolean }): JSX.Element | null {
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)
  const formatter = useLocalizationContext()

  const {
    derivedSwapInfo: {
      trade: { trade },
    },
  } = useSwapFormContext()

  if (!trade) {
    return null
  }

  return (
    <TouchableArea
      {...(isHoverable && {
        '$group-hover': {
          opacity: 1,
        },
        opacity: 0,
        animation: 'simple',
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
        {getRateToDisplay(formatter, trade, showInverseRate)}
      </Text>
    </TouchableArea>
  )
}

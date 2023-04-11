import React from 'react'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CurrencyInfo } from 'src/features/dataApi/types'

interface Props {
  inputCurrencyInfo: NullUndefined<CurrencyInfo>
  outputCurrencyInfo: NullUndefined<CurrencyInfo>
  size: number
}

/*
 * Logo, where left 50% of width is taken from one icon (its left 50%)
 * and right side is taken from another icon (its right 50%)
 */
export function SplitLogo({ size, inputCurrencyInfo, outputCurrencyInfo }: Props): JSX.Element {
  const iconSize = size / 2
  return (
    <Box height={size} width={size}>
      <Box
        left={0}
        overflow="hidden"
        position="absolute"
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}>
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size} />
      </Box>
      <Box
        flexDirection="row-reverse"
        overflow="hidden"
        position="absolute"
        right={0}
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}>
        <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrencyInfo} size={size} />
      </Box>
    </Box>
  )
}

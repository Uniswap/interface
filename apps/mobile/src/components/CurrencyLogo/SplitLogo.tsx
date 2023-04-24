import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { CurrencyLogo, STATUS_RATIO } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout/Box'
import { ChainId } from 'src/constants/chains'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { getNetworkForegroundColor } from 'src/utils/colors'

interface Props {
  inputCurrencyInfo: NullUndefined<CurrencyInfo>
  outputCurrencyInfo: NullUndefined<CurrencyInfo>
  size: number
  chainId: ChainId | null
}

/*
 * Logo, where left 50% of width is taken from one icon (its left 50%)
 * and right side is taken from another icon (its right 50%)
 */
export function SplitLogo({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
  chainId,
}: Props): JSX.Element {
  const theme = useAppTheme()

  const iconSize = size / 2

  const icon =
    chainId && chainId !== ChainId.Mainnet ? (
      <NetworkLogo
        backgroundColor={getNetworkForegroundColor(theme, chainId)}
        borderColor={theme.colors.background0}
        borderRadius="rounded8"
        borderWidth={2}
        chainId={chainId}
        size={size * STATUS_RATIO}
      />
    ) : undefined

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
      {icon && (
        <Box bottom={-4} position="absolute" right={-4}>
          {icon}
        </Box>
      )}
    </Box>
  )
}

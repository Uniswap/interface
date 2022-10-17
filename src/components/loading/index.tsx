import React from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { BoxLoader } from 'src/components/loading/BoxLoader'
import { FavoriteLoader } from 'src/components/loading/FavoriteLoader'
import { HeaderLoader } from 'src/components/loading/HeaderLoader'
import { Shimmer } from 'src/components/loading/Shimmer'
import { TokenLoader } from 'src/components/loading/TokenLoader'
import { WalletLoader } from 'src/components/loading/WalletLoader'
import GraphCurveArea from './graph-curve-area.svg'

type SkeletonType = 'box' | 'graph' | 'header' | 'token' | 'image' | 'favorite' | 'grid' | 'wallets'

interface LoadingProps {
  type?: SkeletonType
  repeat?: number
  showSeparator?: boolean
}

const useChildFromType = (
  type: SkeletonType,
  repeat: number,
  showSeparator: boolean | undefined
) => {
  const theme = useAppTheme()
  switch (type) {
    case 'header':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i: number, { length }) => (
            <React.Fragment key={i}>
              <HeaderLoader />
              {showSeparator && i !== length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </Box>
      )
    case 'graph':
      return (
        <Box overflow="hidden">
          <GraphCurveArea color={theme.colors.backgroundAction} />
          <GraphCurveArea fill={theme.colors.backgroundAction} style={StyleSheet.absoluteFill} />
        </Box>
      )
    case 'token':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i, { length }) => (
            <React.Fragment key={i}>
              <TokenLoader />
              {showSeparator && i !== length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </Box>
      )
    case 'wallets':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i, { length }) => (
            <React.Fragment key={i}>
              <WalletLoader opacity={(length - i) / length} />
            </React.Fragment>
          ))}
        </Box>
      )
    case 'favorite':
      return (
        <Flex row>
          {new Array(repeat).fill(null).map((_, i) => (
            <FavoriteLoader key={i} height={50} />
          ))}
        </Flex>
      )
    case 'image':
      if (repeat > 1) throw new Error('Loading placeholder for images does not support repeat')
      return <BoxLoader aspectRatio={1} borderRadius="none" />
    case 'grid':
      return (
        <Box>
          {new Array(repeat / 2).fill(null).map((_, i, {}) => (
            <React.Fragment key={i}>
              <Flex row gap="none">
                <BoxLoader aspectRatio={1} borderRadius="none" m="xxs" width="50%" />
                <BoxLoader aspectRatio={1} borderRadius="none" m="xxs" width="50%" />
              </Flex>
            </React.Fragment>
          ))}
        </Box>
      )
    case 'box':
    default:
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i, { length }) => (
            <React.Fragment key={i}>
              <BoxLoader height={50} mb="sm" />
              {showSeparator && i !== length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </Box>
      )
  }
}

export function Loading({ type = 'box', repeat = 1, showSeparator }: LoadingProps) {
  const child = useChildFromType(type, repeat, showSeparator)

  return <Shimmer>{child}</Shimmer>
}

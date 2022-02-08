import React from 'react'
import { StyleSheet } from 'react-native'
import { Box } from 'src/components/layout'
import { BoxLoader } from 'src/components/loading/BoxLoader'
import { HeaderLoader } from 'src/components/loading/HeaderLoader'
import { Shimmer } from 'src/components/loading/Shimmer'
import { theme } from 'src/styles/theme'
import GraphCurveArea from './graph-curve-area.svg'
import GraphCurve from './graph-curve.svg'

type SkeletonType = 'box' | 'graph' | 'header'

interface LoadingProps {
  type?: SkeletonType
  repeat?: number
}

const getChildFromType = (type: SkeletonType, repeat: number) => {
  switch (type) {
    case 'header':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <HeaderLoader key={i} />
          ))}
        </Box>
      )
    case 'graph':
      return (
        <Box borderRadius="lg" overflow="hidden">
          <GraphCurve stroke={theme.colors.gray100} />
          <GraphCurveArea fill={theme.colors.gray50} style={StyleSheet.absoluteFill} />
        </Box>
      )
    case 'box':
    default:
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <BoxLoader key={i} />
          ))}
        </Box>
      )
  }
}

export function Loading({ type = 'box', repeat = 1 }: LoadingProps) {
  const child = getChildFromType(type, repeat)

  return <Shimmer>{child}</Shimmer>
}

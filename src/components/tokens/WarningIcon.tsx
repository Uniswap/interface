import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import XOctagon from 'src/assets/icons/x-octagon.svg'
import {
  TokenWarningLevel,
  useTokenWarningLevelColors,
} from 'src/features/tokens/useTokenWarningLevel'

interface Props {
  tokenWarningLevel: TokenWarningLevel
}

export default function WarningIcon({ tokenWarningLevel, ...rest }: Props & SvgProps) {
  const colorKey = useTokenWarningLevelColors(tokenWarningLevel)
  const theme = useAppTheme()
  if (
    tokenWarningLevel === TokenWarningLevel.LOW ||
    tokenWarningLevel === TokenWarningLevel.MEDIUM
  ) {
    return <AlertTriangle color={theme.colors[colorKey]} {...rest} />
  }

  if (tokenWarningLevel === TokenWarningLevel.BLOCKED) {
    return <XOctagon color={theme.colors[colorKey]} {...rest} />
  }

  return null
}

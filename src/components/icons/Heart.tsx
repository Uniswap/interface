import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import HeartIcon from 'src/assets/icons/heart.svg'
import { colors } from 'src/styles/color'

type Props = {
  active: boolean
  size: number
}

function _Heart({ active, size }: Props) {
  const theme = useAppTheme()

  return (
    <HeartIcon
      color={theme.colors.textPrimary}
      fill={active ? colors.pink400 : theme.colors.none}
      height={size}
      stroke={active ? colors.pink400 : theme.colors.textPrimary}
      strokeWidth={2}
      width={size}
    />
  )
}

export const Heart = memo(_Heart)

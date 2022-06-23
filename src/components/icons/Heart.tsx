import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import HeartIcon from 'src/assets/icons/heart.svg'

type Props = {
  active: boolean
  size: number
}

function _Heart({ active, size }: Props) {
  const theme = useAppTheme()

  return (
    <HeartIcon
      color={active ? theme.colors.accentAction : theme.colors.textTertiary}
      fill={active ? theme.colors.accentAction : theme.colors.backgroundSurface}
      height={size}
      width={size}
    />
  )
}

export const Heart = memo(_Heart)

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
      color={active ? theme.colors.accentBackgroundAction : theme.colors.neutralTextTertiary}
      fill={active ? theme.colors.accentBackgroundAction : theme.colors.neutralSurface}
      height={size}
      width={size}
    />
  )
}

export const Heart = memo(_Heart)

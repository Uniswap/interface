import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import StarIcon from 'src/assets/icons/star.svg'

type Props = {
  active: boolean
  size: number
}

function _Star({ active, size }: Props) {
  const theme = useAppTheme()

  return (
    <StarIcon
      fill={active ? theme.colors.deprecated_yellow : theme.colors.deprecated_gray50}
      height={size}
      stroke={active ? theme.colors.deprecated_yellow : theme.colors.deprecated_gray400}
      width={size}
    />
  )
}

export const Star = memo(_Star)

import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { Flex } from 'src/components/layout'

interface FilterGroupProps {
  onPressOrderBy: () => void
}

export function SortingGroup({ onPressOrderBy }: FilterGroupProps) {
  const theme = useAppTheme()
  return (
    <Flex row justifyContent="flex-end">
      <IconButton
        icon={<SwapArrow color={theme.colors.neutralTextTertiary} height={20} width={20} />}
        m="none"
        p="none"
        onPress={onPressOrderBy}
      />
    </Flex>
  )
}

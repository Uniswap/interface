import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import ArrowUpDown from 'src/assets/icons/arrow-up-down.svg'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'

interface FilterGroupProps {
  onPressOrderBy: () => void
}

export function SortingGroup({ onPressOrderBy }: FilterGroupProps) {
  const theme = useAppTheme()
  return (
    <TextButton onPress={onPressOrderBy}>
      <Flex row alignItems="center" gap="xs" justifyContent="flex-end">
        <ArrowUpDown color={theme.colors.textTertiary} height={24} width={24} />
      </Flex>
    </TextButton>
  )
}

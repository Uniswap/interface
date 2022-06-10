import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

interface FilterGroupProps {
  onPressOrderBy: () => void
}

export function SortingGroup({ onPressOrderBy }: FilterGroupProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  return (
    <TextButton mt="md" onPress={onPressOrderBy}>
      <Flex row gap="xs">
        <SwapArrow color={theme.colors.neutralTextTertiary} height={20} width={20} />
        <Text color="neutralTextSecondary" variant="subHead1">
          {t('Market cap')}
        </Text>
      </Flex>
    </TextButton>
  )
}

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TokensOrderBy } from 'src/features/explore/types'
import { getOrderByLabel } from 'src/features/explore/utils'

interface FilterGroupProps {
  orderBy: TokensOrderBy
  onPress: () => void
}

function _SortButton({ orderBy, onPress }: FilterGroupProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  return (
    <TouchableArea py="xs" onPress={onPress}>
      <Flex centered row bg="background2" borderRadius="sm" gap="xxs" p="xs">
        <Text color="textSecondary" pl="xxxs" textAlign="center" variant="buttonLabelSmall">
          {getOrderByLabel(orderBy, t)}
        </Text>
        <Chevron color={theme.colors.textSecondary} direction="s" height={16} width={16} />
      </Flex>
    </TouchableArea>
  )
}

export const SortButton = memo(_SortButton)

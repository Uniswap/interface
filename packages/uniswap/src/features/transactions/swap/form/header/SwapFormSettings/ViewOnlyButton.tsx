import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'

type ViewOnlyButtonProps = {
  onPress: () => void
}

export const ViewOnlyButton = ({ onPress }: ViewOnlyButtonProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <TouchableArea
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      justifyContent="center"
      px="$spacing8"
      py="$spacing4"
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing4">
        <Eye color="$neutral2" size="$icon.16" />
        <Text color="$neutral2" variant="buttonLabel2">
          {t('swap.header.viewOnly')}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

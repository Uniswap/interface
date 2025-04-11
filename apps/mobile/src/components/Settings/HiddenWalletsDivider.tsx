import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp, SortVertical } from 'ui/src/components/icons'

export function HiddenWalletsDivider({
  numHidden,
  isExpanded,
  onPress,
}: {
  padded?: boolean
  numHidden: number
  isExpanded: boolean
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea activeOpacity={1} mx="$spacing16" onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing8">
        <Flex centered grow row gap="$spacing12">
          <Separator />

          <Flex centered row gap="$gap4">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('settings.section.wallet.hidden.row.title', { numHidden })}
            </Text>

            <Flex centered justifyContent="center">
              {isExpanded ? (
                <AnglesDownUp color="$neutral2" size="$icon.16" />
              ) : (
                <SortVertical color="$neutral2" size="$icon.16" />
              )}
            </Flex>
          </Flex>

          <Separator />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

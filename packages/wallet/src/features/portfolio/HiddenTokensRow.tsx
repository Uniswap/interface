import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp, SortVertical } from 'ui/src/components/icons'
import { isMobileApp } from 'utilities/src/platform'

export function HiddenTokensRow({
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
    <TouchableArea activeOpacity={1} mx={isMobileApp ? '$spacing16' : undefined} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing8">
        <Flex centered grow row gap="$spacing12">
          <Separator />

          <Flex centered row gap="$gap4">
            <Text color="$neutral3" textAlign="center" variant="body3">
              {t('hidden.tokens.info.text.button', { numHidden })}
            </Text>

            <Flex centered justifyContent="center">
              {isExpanded ? (
                <AnglesDownUp color="$neutral3" size="$icon.16" />
              ) : (
                <SortVertical color="$neutral3" size="$icon.16" />
              )}
            </Flex>
          </Flex>

          <Separator />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

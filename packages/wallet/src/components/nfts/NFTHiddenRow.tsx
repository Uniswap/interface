import { useTranslation } from 'react-i18next'
import { Flex, ImpactFeedbackStyle, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp, SortVertical } from 'ui/src/components/icons'

export function HiddenNftsRow({
  numHidden,
  isExpanded,
  onPress,
}: {
  numHidden: number
  isExpanded: boolean
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea hapticFeedback activeOpacity={1} hapticStyle={ImpactFeedbackStyle.Light} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing12">
        <Flex centered grow row gap="$spacing12">
          <Separator />

          <Flex centered row gap="$gap4">
            <Text color="$neutral3" textAlign="center" variant="body3">
              {t('hidden.nfts.info.text.button', { numHidden })}
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

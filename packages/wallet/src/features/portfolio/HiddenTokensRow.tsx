import { useTranslation } from 'react-i18next'
import { Flex, ImpactFeedbackStyle, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp, SortVertical } from 'ui/src/components/icons'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function HiddenTokensRow({
  padded = false,
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
    <TouchableArea
      hapticFeedback
      activeOpacity={1}
      hapticStyle={ImpactFeedbackStyle.Light}
      mx="$spacing12"
      onPress={onPress}
    >
      <Flex row alignItems="center" justifyContent="space-between" px={padded ? '$spacing12' : '$none'} py="$spacing12">
        <Separator />
        {/* just used for opacity styling, the parent TouchableArea handles event */}
        <TouchableArea
          hapticFeedback
          hapticStyle={ImpactFeedbackStyle.Light}
          testID={TestID.ShowHiddenTokens}
          onPress={onPress}
        >
          <Flex centered row gap="$spacing4">
            <Text color="$neutral3" variant="body4">
              {t('hidden.tokens.info.text.button', { numHidden })}
            </Text>
            {isExpanded ? (
              <AnglesDownUp color="$neutral3" size="$icon.16" />
            ) : (
              <SortVertical color="$neutral3" size="$icon.16" />
            )}
          </Flex>
        </TouchableArea>
        <Separator />
      </Flex>
    </TouchableArea>
  )
}

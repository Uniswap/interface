import { ImpactFeedbackStyle } from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

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
      onPress={onPress}>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        px={padded ? '$spacing24' : '$none'}
        py="$spacing12">
        <Text color="$neutral2" variant="subheading2">
          {t('tokens.hidden.label', { numHidden })}
        </Text>
        {/* just used for opacity styling, the parent TouchableArea handles event */}
        <TouchableArea hapticFeedback hapticStyle={ImpactFeedbackStyle.Light} onPress={onPress}>
          <Flex
            row
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$roundedFull"
            gap="$spacing2"
            justifyContent="center"
            pl="$spacing12"
            pr="$spacing8"
            py="$spacing8"
            // set width because otherwise the Text/Frame move as they animate
            width={93}>
            <AnimatePresence exitBeforeEnter initial={false}>
              <Text
                key={isExpanded ? 0 : 1}
                animation="100ms"
                color="$neutral2"
                enterStyle={{
                  y: -5,
                  opacity: 0,
                }}
                exitStyle={{
                  y: 5,
                  opacity: 0,
                }}
                textAlign="center"
                userSelect="none"
                variant="buttonLabel3"
                width={45}>
                {isExpanded ? t('common.button.hide') : t('common.button.show')}
              </Text>
            </AnimatePresence>
            <Icons.RotatableChevron
              animation="semiBouncy"
              color="$neutral2"
              direction="down"
              height={iconSizes.icon20}
              rotate={`${isExpanded ? 180 : 0}deg`}
              width={iconSizes.icon20}
            />
          </Flex>
        </TouchableArea>
      </Flex>
    </TouchableArea>
  )
}

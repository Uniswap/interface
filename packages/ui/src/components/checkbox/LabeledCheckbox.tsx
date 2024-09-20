import { ColorTokens, SpaceTokens } from 'tamagui'
import { Checkbox, CheckboxSizeTokens } from 'ui/src/components/checkbox/Checkbox'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { SporeComponentVariant } from 'ui/src/components/types'

export type LabeledCheckboxProps = {
  size?: CheckboxSizeTokens
  checked: boolean
  text?: string | JSX.Element
  checkedColor?: ColorTokens
  onCheckPressed?: (currentState: boolean) => void
  variant?: SporeComponentVariant
  gap?: SpaceTokens
  px?: SpaceTokens
}

export function LabeledCheckbox({
  checked,
  text,
  variant,
  size = '$icon.20',
  gap = '$spacing12',
  px = '$spacing4',
  onCheckPressed,
}: LabeledCheckboxProps): JSX.Element {
  const onPress = (): void => {
    onCheckPressed?.(checked)
  }

  const textElement =
    typeof text === 'string' ? (
      <Text $short={{ variant: 'buttonLabel4' }} variant="subheading2">
        {text}
      </Text>
    ) : (
      text
    )

  return (
    <TouchableArea onPress={onPress}>
      <Flex row alignItems="center" gap={gap} px={px}>
        <Checkbox checked={checked} size={size} variant={variant} onPress={onPress} />
        {text && <Flex shrink>{textElement}</Flex>}
      </Flex>
    </TouchableArea>
  )
}

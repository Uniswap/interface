import { ColorTokens } from 'tamagui'
import { Checkbox } from 'ui/src/components/checkbox/Checkbox'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { SporeComponentVariant } from 'ui/src/components/types'

export type LabeledCheckboxProps = {
  checked: boolean
  text?: string | JSX.Element
  checkedColor?: ColorTokens
  onCheckPressed?: (currentState: boolean) => void
  variant?: SporeComponentVariant
}

export function LabeledCheckbox({ text, checked, variant, onCheckPressed }: LabeledCheckboxProps): JSX.Element {
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
      <Flex row alignItems="center" gap="$spacing12" px="$spacing4">
        <Checkbox checked={checked} variant={variant} onPress={onPress} />
        {text && <Flex shrink>{textElement}</Flex>}
      </Flex>
    </TouchableArea>
  )
}

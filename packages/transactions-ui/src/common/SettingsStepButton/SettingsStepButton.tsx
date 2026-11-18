import { Flex, iconSizes, TouchableArea } from '@universe/mycelium'
import { Plus } from '@universe/mycelium/icons/Plus'

export interface SettingsStepButtonProps {
  /** `increment` draws a plus, `decrement` a minus bar. */
  direction: 'increment' | 'decrement'
  /** The value sits at this end of its range: the button greys out and ignores presses. */
  disabled: boolean
  /** The caller applies its step and clamps. */
  onPress: () => void
  testID?: string
}

/**
 * The round minus or plus button on each side of a native settings stepper: SlippageScreen
 * and DeadlineScreen.
 *
 * Replaces PlusMinusButton (ui/src) in SlippageScreenNative and DeadlineScreen.
 */
export function SettingsStepButton({ direction, disabled, onPress, testID }: SettingsStepButtonProps): JSX.Element {
  return (
    <TouchableArea
      alignItems="center"
      backgroundColor={disabled ? '$surface3' : '$neutral2'}
      borderRadius="$roundedFull"
      disabled={disabled}
      height={iconSizes.icon28}
      justifyContent="center"
      testID={testID}
      width={iconSizes.icon28}
      onPress={onPress}
    >
      {direction === 'increment' ? (
        <Plus color="$surface1" size="$icon.12" strokeWidth={2.5} />
      ) : (
        <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
      )}
    </TouchableArea>
  )
}

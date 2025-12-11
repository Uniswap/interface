import { Button, type ButtonEmphasis, type ButtonVariant, Flex, type FlexProps } from 'ui/src'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'

export type ButtonConfig = {
  testID?: TestIDType
  text: string
  onPress: () => void
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
}

export interface DialogButtonsProps {
  primaryButton?: ButtonConfig
  secondaryButton?: ButtonConfig
  isPrimaryButtonLoading?: boolean
  buttonContainerProps?: FlexProps
}

const DEFAULT_BUTTON_CONTAINER_PROPS: FlexProps = {
  flexDirection: 'row',
  gap: '$spacing8',
  width: '100%',
} as const

export function DialogButtons({
  primaryButton,
  secondaryButton,
  isPrimaryButtonLoading,
  buttonContainerProps,
}: DialogButtonsProps): JSX.Element {
  return (
    <Flex {...DEFAULT_BUTTON_CONTAINER_PROPS} {...buttonContainerProps}>
      {secondaryButton?.text && (
        <Button
          testID={secondaryButton.testID}
          variant={secondaryButton.variant ?? 'default'}
          emphasis={secondaryButton.emphasis ?? 'secondary'}
          minHeight="$spacing36"
          size="small"
          onPress={secondaryButton.onPress}
        >
          {secondaryButton.text}
        </Button>
      )}
      {primaryButton?.text && (
        <Button
          testID={primaryButton.testID}
          variant={primaryButton.variant ?? 'default'}
          emphasis={primaryButton.emphasis ?? 'primary'}
          minHeight="$spacing36"
          loading={isPrimaryButtonLoading}
          size="small"
          onPress={primaryButton.onPress}
        >
          {primaryButton.text}
        </Button>
      )}
    </Flex>
  )
}

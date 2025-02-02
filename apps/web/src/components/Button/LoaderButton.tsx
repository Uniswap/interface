import { PropsWithChildren } from 'react'
import { ColorTokens, DeprecatedButton, Flex, SpinningLoader, WidthAnimator, type DeprecatedButtonProps } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

type LoaderButtonProps = DeprecatedButtonProps & {
  buttonKey: string
  loading: boolean
  loaderColor?: ColorTokens
}

export function LoaderButton({
  buttonKey,
  loading,
  size,
  animation,
  children,
  loaderColor,
  ...rest
}: PropsWithChildren<LoaderButtonProps>) {
  return (
    <DeprecatedButton
      key={`LoaderButton-animation-${buttonKey}`}
      size={size ?? 'large'}
      animation={animation ?? 'fastHeavy'}
      {...rest}
    >
      <Flex row alignItems="center" gap="$spacing8">
        <WidthAnimator open={loading} height={iconSizes.icon24}>
          <Flex justifyContent="center" alignItems="center" width={iconSizes.icon24}>
            <SpinningLoader color={loaderColor ?? '$white'} />
          </Flex>
        </WidthAnimator>
        {children}
      </Flex>
    </DeprecatedButton>
  )
}

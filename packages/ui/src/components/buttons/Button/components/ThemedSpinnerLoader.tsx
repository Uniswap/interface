import { useStyle } from 'tamagui'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText'
import { useIconSizes } from 'ui/src/components/buttons/Button/hooks/useIconSizes'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'

export const ThemedSpinningLoader = ({
  size = 'medium',
  variant,
  emphasis,
  isDisabled,
}: Pick<ButtonVariantProps, 'size' | 'variant' | 'emphasis' | 'isDisabled'>): JSX.Element => {
  const iconSizes = useIconSizes()
  // @ts-expect-error we know the color will be there; deficiency in tamagui's types
  // TODO: possibly look into this as a performance bottleneck (refer to typedef for more info)
  const { color } = useStyle({ variant, emphasis, isDisabled }, { forComponent: CustomButtonText })

  const loaderSize = iconSizes[size]

  return <SpinningLoader color={color} size={loaderSize} />
}

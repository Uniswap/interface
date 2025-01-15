import { cloneElement } from 'react'
import { useStyle } from 'tamagui'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText'
import { useIconSizes } from 'ui/src/components/buttons/Button/hooks/useIconSizes'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'

export const ThemedIcon = ({
  children,
  size = 'medium',
  variant,
  disabled,
  emphasis,
}: ButtonVariantProps & {
  children?: JSX.Element
}): JSX.Element | null => {
  const iconSizes = useIconSizes()

  // @ts-expect-error we know the color will be there; deficiency in tamagui's types
  // TODO: possibly look into this as a performance bottleneck (refer to typedef for more info)
  const { color } = useStyle(
    { variant, emphasis, disabled },
    {
      forComponent: CustomButtonText,
    },
  )

  if (!children) {
    return null
  }

  const width = iconSizes[size]
  const height = width

  return cloneElement(children, {
    color,
    width,
    height,
  })
}

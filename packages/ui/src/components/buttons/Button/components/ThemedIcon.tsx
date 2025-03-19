import { cloneElement } from 'react'
import { useStyle } from 'tamagui'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText'
import { TypeOfButton } from 'ui/src/components/buttons/Button/components/types'
import { useIconSizes } from 'ui/src/components/buttons/Button/hooks/useIconSizes'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'

export const ThemedIcon = ({
  children,
  size = 'medium',
  variant,
  isDisabled,
  emphasis,
  typeOfButton,
}: ButtonVariantProps & {
  children?: JSX.Element
  typeOfButton: TypeOfButton
}): JSX.Element | null => {
  const iconSizes = useIconSizes(typeOfButton)

  // @ts-expect-error we know the color will be there; deficiency in tamagui's types
  // TODO: possibly look into this as a performance bottleneck (refer to typedef for more info)
  const { color, '$group-item-hover': groupItemHover } = useStyle(
    { variant, emphasis, isDisabled },
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
    color: children.props?.color ?? color,
    width,
    height,
    '$group-item-hover': groupItemHover,
  })
}

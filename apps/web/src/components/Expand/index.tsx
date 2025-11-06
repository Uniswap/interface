import { PropsWithChildren, ReactElement } from 'react'
import { Flex, FlexProps, HeightAnimator } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'

export default function Expand({
  header,
  button,
  children,
  testId,
  isOpen,
  padding,
  onToggle,
  iconSize = 'icon24',
  paddingTop,
  width,
}: PropsWithChildren<{
  header?: ReactElement
  button: ReactElement
  testId?: string
  isOpen: boolean
  padding?: FlexProps['p']
  onToggle: () => void
  iconSize?: keyof typeof iconSizes
  paddingTop?: FlexProps['pt']
  width?: FlexProps['width']
}>) {
  return (
    <Flex p={padding} width={width}>
      <Flex row justifyContent="space-between">
        {header}
        <Flex
          row
          cursor="pointer"
          width="unset"
          justifyContent="flex-end"
          data-testid={testId}
          onPress={onToggle}
          aria-expanded={isOpen}
        >
          {button}
          <RotatableChevron height={iconSizes[iconSize]} direction={isOpen ? 'up' : 'down'} color="$neutral2" />
        </Flex>
      </Flex>
      <HeightAnimator open={isOpen}>
        <Flex gap="$gap12" pt={paddingTop}>
          {children}
        </Flex>
      </HeightAnimator>
    </Flex>
  )
}

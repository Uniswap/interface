import { useRef } from 'react'
import { Theme } from 'tamagui'
import { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { useOnClickOutside } from 'utilities/src/react/hooks'

export function Coachmark({
  open,
  onDismiss,
  text,
  placement,
  offset,
  zIndex,
  testID,
  children,
}: CoachmarkProps): JSX.Element {
  const shadowProps = useShadowPropsMedium()

  const contentRef = useRef<HTMLDivElement>(null)
  useOnClickOutside({ node: contentRef, handler: open ? onDismiss : undefined })

  return (
    <Tooltip open={open} placement={placement} offset={offset} stayInFrame={false}>
      <Flex alignSelf="flex-start">
        <Tooltip.Trigger>{children}</Tooltip.Trigger>
      </Flex>
      <Theme inverse>
        <Tooltip.Content
          ref={contentRef}
          zIndex={zIndex}
          pointerEvents="auto"
          backgroundColor="$surface1"
          borderColor="$surface3"
          borderWidth={1}
          borderRadius="$rounded12"
          width={190}
          p="$spacing12"
          gap="$spacing4"
          alignItems="flex-start"
          {...shadowProps}
          testID={testID}
          cursor="pointer"
          onPress={onDismiss}
        >
          <Tooltip.Arrow />
          <Text variant="body4" color="$neutral1" alignSelf="stretch">
            {text}
          </Text>
        </Tooltip.Content>
      </Theme>
    </Tooltip>
  )
}

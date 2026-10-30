import { Flex, Text, useSporeColors } from '@universe/mycelium'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { useRef } from 'react'
import { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import type { TooltipFrameStyleProps } from 'ui/src/components/tooltip/types'
import { useOnClickOutside } from 'utilities/src/react/hooks'

const DEFAULT_COACHMARK_WIDTH = 190

export function Coachmark({
  open,
  onDismiss,
  title,
  text,
  width = DEFAULT_COACHMARK_WIDTH,
  placement,
  offset,
  zIndex,
  testID,
  children,
}: CoachmarkProps): JSX.Element {
  // useShadowPropsMedium branches on runtime `isWebApp`, not this file's .web suffix:
  // in the extension (also a .web consumer) it returns RN shadow keys with no
  // `$platform-web` slice. Spread the whole result — the tooltip style resolver folds
  // either shape into boxShadow. The cast narrows the hook's Tamagui-typed declaration
  // (`somewhat-strict-web` token unions) to its actual runtime values: plain rgba
  // strings and numeric offsets.
  const shadowProps = useShadowPropsMedium() as Pick<
    TooltipFrameStyleProps,
    'shadowColor' | 'shadowOffset' | 'shadowRadius' | '$platform-web'
  >

  // The legacy inverse look came from a Tamagui `<Theme inverse>` wrapper, but the
  // rebuilt Tooltip.Content portals to document.body — outside any ancestor theme
  // scope (a DOM class) — so every inverse-resolved color is passed explicitly via
  // the theme's `*Contrast` tokens (each theme's contrast value is the opposite
  // theme's base value).
  const colors = useSporeColors()

  const contentRef = useRef<HTMLDivElement>(null)
  useOnClickOutside({ node: contentRef, handler: open ? onDismiss : undefined })

  return (
    <Tooltip open={open} placement={placement} offset={offset} stayInFrame={false}>
      <Flex alignSelf="flex-start">
        <Tooltip.Trigger>{children}</Tooltip.Trigger>
      </Flex>
      <Tooltip.Content
        ref={contentRef}
        zIndex={zIndex}
        pointerEvents="auto"
        backgroundColor={colors.surface1Contrast.val}
        borderColor={colors.surface3Contrast.val}
        borderWidth={1}
        borderRadius="$rounded12"
        width={width}
        p="$spacing12"
        gap="$spacing4"
        alignItems="flex-start"
        {...shadowProps}
        testID={testID}
        cursor="pointer"
        onPress={onDismiss}
      >
        <Tooltip.Arrow backgroundColor={colors.surface1Contrast.val} borderColor={colors.surface3Contrast.val} />
        {title && (
          <Text variant="body3" color={colors.neutral1Contrast.val} alignSelf="stretch">
            {title}
          </Text>
        )}
        <Text variant="body4" color={colors.neutral1Contrast.val} alignSelf="stretch">
          {text}
        </Text>
      </Tooltip.Content>
    </Tooltip>
  )
}

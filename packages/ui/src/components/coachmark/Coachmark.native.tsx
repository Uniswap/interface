import { Flex } from '@universe/mycelium'
import { Text } from '@universe/mycelium'
import { TouchableArea, useIsDarkMode, useSporeColors } from '@universe/mycelium'
import {
  FloatingOverlayAnchor,
  FloatingOverlayArrow,
  FloatingOverlayContent,
  type FloatingOverlayPlacement,
  FloatingOverlayRoot,
  joinPlacement,
  splitPlacement,
} from '@universe/mycelium/floating-overlay'
import { type UseSporeColorsReturn, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { type ReactNode, useEffect, useRef } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'
import type { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { spacing } from 'ui/src/theme/spacing'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { useEvent } from 'utilities/src/react/hooks'

export const COACHMARK_BUBBLE_TEST_ID = 'coachmark-bubble'

const DEFAULT_COACHMARK_WIDTH = 190
const COACHMARK_FONT_SIZE = 12
const COACHMARK_LINE_HEIGHT = 16
const BEAK_SIZE = 12
const SCREEN_EDGE_PADDING = spacing.spacing16
const ENTER_FADE_DURATION_MS = 200

/**
 * The legacy look inverted the whole bubble via a theme wrapper; the rebuilt leg has no
 * theme-scoping wrapper, so every inverse-resolved color is passed explicitly — the same
 * approach as Coachmark.web.
 *
 * TODO(INFRA-3318): digging surface colors out of the opposite theme is a parity crutch —
 * replace with theme-level contrast/accent tokens once the theme exposes them (same TODO
 * on Coachmark.web; retire both together).
 */
function useInverseSporeColors(): UseSporeColorsReturn {
  const isDarkMode = useIsDarkMode()
  return useSporeColors(isDarkMode ? 'light' : 'dark')
}

/** Coachmark only floats vertically: left/right placements coerce to bottom, keeping their alignment. */
export function getNativePlacement(placement: NonNullable<CoachmarkProps['placement']>): FloatingOverlayPlacement {
  const { side, align } = splitPlacement(placement)
  return joinPlacement(side === 'top' ? 'top' : 'bottom', align)
}

/** Overlaps the beak 1px into the bubble so the seam over the bubble's border is hidden. */
function getBeakSeamStyle(placement: NonNullable<CoachmarkProps['placement']>): StyleProp<ViewStyle> {
  // getNativePlacement keeps top as top and coerces every other side to bottom, so the
  // raw placement's side alone decides the nudge direction — no round trip needed.
  return { transform: [{ translateY: splitPlacement(placement).side === 'top' ? -1 : 1 }] }
}

interface CoachmarkBubbleProps {
  title?: string
  text: string
  width?: number
  onDismiss: () => void
  testID?: string
}

export function CoachmarkBubble({
  title,
  text,
  width = DEFAULT_COACHMARK_WIDTH,
  onDismiss,
  testID,
}: CoachmarkBubbleProps): JSX.Element {
  const shadowProps = useShadowPropsMedium()
  const inverseColors = useInverseSporeColors()

  return (
    <TouchableArea testID={testID} onPress={onDismiss}>
      <Flex
        testID={COACHMARK_BUBBLE_TEST_ID}
        backgroundColor={inverseColors.surface1.val}
        borderColor={inverseColors.surface3.val}
        borderWidth={1}
        borderRadius="$rounded12"
        width={width}
        gap="$spacing4"
        alignItems="flex-start"
        p="$spacing12"
        {...shadowProps}
      >
        {title && (
          <Text variant="body3" color={inverseColors.neutral1.val} alignSelf="stretch">
            {title}
          </Text>
        )}
        <Text
          variant="body4"
          fontSize={COACHMARK_FONT_SIZE}
          lineHeight={COACHMARK_LINE_HEIGHT}
          color={inverseColors.neutral1.val}
          alignSelf="stretch"
        >
          {text}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

function EnterFade({ open, children }: { open: boolean; children: ReactNode }): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    // Keyed on `open` rather than mount so the fade stays correct even if the overlay
    // primitive ever keeps closed content mounted (today it unmounts it).
    if (!open) {
      opacity.setValue(0)
      return
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: ENTER_FADE_DURATION_MS,
      useNativeDriver: true,
    }).start()
  }, [open, opacity])
  // Zero-styled wrapper: the beak's absolute insets resolve against its parent's content
  // box, so any border/padding here would displace the beak into the bubble.
  return <Animated.View style={{ opacity }}>{children}</Animated.View>
}

/**
 * Native coachmark: a one-time educational callout anchored to its children, on the
 * mycelium floating-overlay primitive (INFRA-2965) — the content portals into the
 * app-root `FloatingOverlayProvider` layer with a full-screen press-to-dismiss backdrop,
 * replacing the legacy Portal + measure pattern (this component's old `useAnchoredPosition`).
 */
export function Coachmark({
  open,
  onDismiss,
  title,
  text,
  width,
  placement = 'bottom-start',
  offset,
  zIndex,
  testID,
  children,
}: CoachmarkProps): JSX.Element {
  const inverseColors = useInverseSporeColors()

  const handleOpenChange = useEvent((next: boolean): void => {
    // The overlay only requests closes (backdrop press); open state stays controlled here.
    if (!next) {
      onDismiss()
    }
  })

  return (
    <FloatingOverlayRoot open={open} onOpenChange={handleOpenChange}>
      <FloatingOverlayContent
        placement={getNativePlacement(placement)}
        offset={offset}
        viewportPadding={SCREEN_EDGE_PADDING}
        // Legacy contract: a coachmark never flips sides, and the hardware back button
        // is left to navigation instead of dismissing the callout.
        flip={false}
        dismissOnBackPress={false}
        zIndex={zIndex ?? zIndexes.overlay}
      >
        <EnterFade open={open}>
          <CoachmarkBubble title={title} text={text} width={width} testID={testID} onDismiss={onDismiss} />
          {/* The beak must stay OUTSIDE the bordered/padded bubble (it positions against the
              overlay wrapper's origin); it isn't pressable, but taps on it land on the
              backdrop, which dismisses — same outcome as the legacy in-bubble beak. */}
          <FloatingOverlayArrow
            color={inverseColors.surface1.val}
            size={BEAK_SIZE}
            style={getBeakSeamStyle(placement)}
          />
        </EnterFade>
      </FloatingOverlayContent>
      <FloatingOverlayAnchor>{children}</FloatingOverlayAnchor>
    </FloatingOverlayRoot>
  )
}

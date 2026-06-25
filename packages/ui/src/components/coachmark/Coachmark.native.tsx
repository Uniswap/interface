import { Portal, Theme } from 'tamagui'
import type { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { type Side, useAnchoredPosition } from 'ui/src/components/coachmark/hooks/useAnchoredPosition'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable/TouchableArea/TouchableArea'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { zIndexes } from 'ui/src/theme/zIndexes'

const COACHMARK_WIDTH = 190
const COACHMARK_FONT_SIZE = 12
const COACHMARK_LINE_HEIGHT = 16
const BEAK_WIDTH = 12
const BEAK_HEIGHT = 9

interface CoachmarkBubbleProps {
  text: string
  onDismiss: () => void
  side?: Side
  /** Omit to hide the beak (e.g. while measuring the bubble). */
  arrowLeft?: number
  testID?: string
}

export function CoachmarkBubble({
  text,
  onDismiss,
  side = 'bottom',
  arrowLeft,
  testID,
}: CoachmarkBubbleProps): JSX.Element {
  const shadowProps = useShadowPropsMedium()

  const isBottomPlacement = side === 'bottom'

  return (
    <Theme inverse>
      <TouchableArea testID={testID} onPress={onDismiss}>
        <Flex
          backgroundColor="$surface1"
          borderColor="$surface3"
          borderWidth={1}
          borderRadius="$rounded12"
          width={COACHMARK_WIDTH}
          gap="$spacing4"
          alignItems="flex-start"
          p="$spacing12"
          {...shadowProps}
        >
          {arrowLeft !== undefined && (
            // CSS-triangle beak; overlaps the bubble edge by 1px so the seam over the border is hidden.
            <Flex
              position="absolute"
              left={arrowLeft}
              top={isBottomPlacement ? -(BEAK_HEIGHT - 1) : undefined}
              bottom={isBottomPlacement ? undefined : -(BEAK_HEIGHT - 1)}
              width={0}
              height={0}
              borderLeftWidth={BEAK_WIDTH / 2}
              borderRightWidth={BEAK_WIDTH / 2}
              borderLeftColor="$transparent"
              borderRightColor="$transparent"
              borderBottomWidth={isBottomPlacement ? BEAK_HEIGHT : 0}
              borderBottomColor={isBottomPlacement ? '$surface1' : '$transparent'}
              borderTopWidth={isBottomPlacement ? 0 : BEAK_HEIGHT}
              borderTopColor={isBottomPlacement ? '$transparent' : '$surface1'}
            />
          )}
          <Text
            variant="body4"
            fontSize={COACHMARK_FONT_SIZE}
            lineHeight={COACHMARK_LINE_HEIGHT}
            color="$neutral1"
            alignSelf="stretch"
          >
            {text}
          </Text>
        </Flex>
      </TouchableArea>
    </Theme>
  )
}

/**
 * Native coachmark: a one-time educational callout anchored to its children. Tamagui's Tooltip is a
 * no-op on native, so this uses the Portal + measure + backdrop pattern (see ContextMenu.native).
 * Placement math lives in `useAnchoredPosition`, keeping this component close to Coachmark.web's shape.
 */
export function Coachmark({
  open,
  onDismiss,
  text,
  placement = 'bottom-start',
  offset,
  zIndex,
  testID,
  children,
}: CoachmarkProps): JSX.Element {
  const { triggerRef, side, position, hasBubbleSize, measureTrigger, onBubbleLayout } = useAnchoredPosition({
    open,
    placement,
    offset,
    beakWidth: BEAK_WIDTH,
  })

  return (
    <>
      {open && (
        <Portal>
          {/* Full-screen backdrop: any tap dismisses (native equivalent of web's click-outside). */}
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={zIndex ?? zIndexes.overlay}
            onPress={onDismiss}
          >
            {/* Off-screen render to measure the bubble before positioning it. */}
            {!hasBubbleSize && (
              <Flex position="absolute" top={-9999} left={-9999} opacity={0} onLayout={onBubbleLayout}>
                <CoachmarkBubble text={text} side={side} onDismiss={onDismiss} />
              </Flex>
            )}
            {position && (
              <Flex
                position="absolute"
                top={position.top}
                left={position.left}
                animation="200ms"
                enterStyle={{ opacity: 0 }}
              >
                <CoachmarkBubble
                  text={text}
                  side={side}
                  arrowLeft={position.arrowLeft}
                  testID={testID}
                  onDismiss={onDismiss}
                />
              </Flex>
            )}
          </Flex>
        </Portal>
      )}
      <Flex ref={triggerRef} collapsable={false} onLayout={open ? measureTrigger : undefined}>
        {children}
      </Flex>
    </>
  )
}

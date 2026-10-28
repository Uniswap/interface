import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import { BottomSheetFooter, KEYBOARD_STATUS, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { isAndroid } from '@universe/environment'
import { useCallback, useMemo } from 'react'
import type { ColorValue } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import type { UseBottomInsetCoverFooterParams } from 'uniswap/src/components/modals/useBottomInsetCoverFooter'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export const BOTTOM_INSET_COVER_TEST_ID = 'modal-bottom-inset-cover'

type BottomInsetCoverProps = BottomSheetFooterProps & { height: number; backgroundColor: ColorValue }

export function BottomInsetCover({
  animatedFooterPosition,
  height,
  backgroundColor,
}: BottomInsetCoverProps): JSX.Element {
  const { animatedKeyboardState } = useBottomSheetInternal()
  // gorhom lifts the footer above an open keyboard, where it would hide list rows instead of the nav bar.
  const keyboardAwareStyle = useAnimatedStyle(() => ({
    opacity: animatedKeyboardState.get().status === KEYBOARD_STATUS.SHOWN ? 0 : 1,
  }))
  const coverStyle = useMemo(
    () => [{ height, backgroundColor }, keyboardAwareStyle],
    [height, backgroundColor, keyboardAwareStyle],
  )

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <Animated.View pointerEvents="none" style={coverStyle} testID={BOTTOM_INSET_COVER_TEST_ID} />
    </BottomSheetFooter>
  )
}

/**
 * Android draws its navigation bar transparent over the app (see MainActivity), so a sheet that renders behind the
 * bottom inset shows its scrolled rows under the 3-button nav bar. This returns a gorhom footer that pins a strip of
 * the sheet background over that inset at every snap point; a caller-provided footer always wins.
 */
export function useBottomInsetCoverFooter({
  footerComponent,
  renderBehindBottomInset,
  coverBottomInsetOnAndroid,
  backgroundColor,
}: UseBottomInsetCoverFooterParams): ModalProps['footerComponent'] {
  const { bottom } = useAppInsets()

  const renderCover = useCallback(
    (footerProps: BottomSheetFooterProps) => (
      <BottomInsetCover {...footerProps} height={bottom} backgroundColor={backgroundColor} />
    ),
    [bottom, backgroundColor],
  )

  if (footerComponent) {
    return footerComponent
  }

  const shouldCover = isAndroid && renderBehindBottomInset && coverBottomInsetOnAndroid && bottom > 0
  return shouldCover ? renderCover : undefined
}

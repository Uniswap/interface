import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MAX_UNITAG_LENGTH, UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useTimeout } from 'utilities/src/time/timing'

// Per the mock, the input value renders in Heading/3 at book weight; the invisible twin below must
// share these exact metrics so the measured width matches what the input draws. Line height is
// pinned so the field keeps its height when the font scales down to fit narrow screens, and sized
// above heading3's 1.2 because <input> clips glyph ink outside its box (unlike Text): descenders
// like "p" need the extra room. Shared by twin, input, and suffix so heights and baselines stay locked.
const VALUE_LINE_HEIGHT = 32
const VALUE_FONT_PROPS = {
  fontFamily: '$heading',
  fontWeight: '$book',
  lineHeight: VALUE_LINE_HEIGHT,
} as const

// Scale-to-fit bounds so long name + suffix shrink instead of truncating on narrow screens.
// Char width matches ClaimUnitagContent's heuristic (20px at 36px font), scaled to heading3.
const MAX_VALUE_FONT_SIZE = fonts.heading3.fontSize
const MIN_VALUE_FONT_SIZE = 16
const MAX_CHAR_WIDTH_AT_MAX_FONT_SIZE = 14

// Per the mock's shuffle motion: the old name bobs out (drops, blurs, fades), swaps while
// invisible, and the new one bobs back up into place with the same easing.
const SWAP_FADE_MS = 200
const SWAP_OFFSET_PX = 12
const SWAP_BLUR_PX = 4
const SWAP_TRANSITION = ['opacity', 'transform', 'filter']
  .map((prop) => `${prop} ${SWAP_FADE_MS}ms ease-in-out`)
  .join(', ')

// The input's box is sized exactly to the measured text, so a caret at position 0 or after the
// last character sits on the clip edge and gets sliced. Bleed the box this far past the twin on
// both sides (padding pulls the text back into alignment) so the caret has room at both extremes.
const CARET_SLACK = 2

const AVATAR_SIZE = 56
// Aligns the error message with the field text, past the avatar and gap (56 + 12), per the mock.
const ERROR_INDENT = 68

export function SuggestedUnitagInput({
  value,
  onChangeText,
  onShuffle,
  isShuffling,
  error,
}: {
  value: string
  onChangeText: (text: string) => void
  onShuffle: () => void
  isShuffling: boolean
  error?: string
}): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<Input>(null)

  // The field renders this local copy so external value changes (prefill, shuffle) can crossfade:
  // typing syncs it in the same commit, everything else swaps behind the fade. While the rendered
  // copy lags the incoming value the row is faded out; the swap lands once the fade completes
  // (delay -1 disarms the timeout when no swap is pending).
  const [renderedValue, setRenderedValue] = useState(value)
  const isFadedOut = value !== renderedValue
  const completeSwap = useEvent(() => setRenderedValue(value))
  useTimeout(completeSwap, isFadedOut ? SWAP_FADE_MS : -1)

  const handleChangeText = useEvent((text: string) => {
    setRenderedValue(text)
    onChangeText(text)
  })

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_WIDTH_AT_MAX_FONT_SIZE,
    maxFontSize: MAX_VALUE_FONT_SIZE,
    minFontSize: MIN_VALUE_FONT_SIZE,
  })

  // The suffix scales with the name, so size against the full rendered string.
  useEffect(() => {
    onSetFontSize(renderedValue + UNITAG_SUFFIX)
  }, [renderedValue, onSetFontSize])

  const focusInput = useEvent(() => {
    inputRef.current?.focus()
  })

  return (
    <Flex width="100%" gap="$spacing12">
      <Flex row alignItems="flex-start" gap="$spacing12" pr="$spacing8">
        {/* Generic person avatar per the mock: no wallet address exists yet to derive a unicon from. */}
        <Flex centered width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius="$roundedFull" backgroundColor="$accent2">
          <Person size="$icon.28" color="$accent1" />
        </Flex>
        {/* The underline takes on critical theming while the current value is invalid; it clears on edit
            because the availability check's loading state suppresses the error. */}
        <Flex
          fill
          minWidth={0}
          gap="$spacing4"
          pb="$spacing12"
          borderBottomWidth={1.5}
          borderColor={error ? '$statusCritical' : '$surface3'}
          cursor="text"
          onPress={focusInput}
        >
          <Text variant="body3" color="$neutral2">
            {t('embeddedWallet.onboarding.create.usernameLabel')}
          </Text>
          <Flex row alignItems="center" gap="$spacing8">
            <Flex
              row
              fill
              alignItems="center"
              minWidth={0}
              onLayout={onLayout}
              style={{
                opacity: isFadedOut ? 0 : 1,
                transform: isFadedOut ? `translateY(${SWAP_OFFSET_PX}px)` : 'translateY(0)',
                filter: isFadedOut ? `blur(${SWAP_BLUR_PX}px)` : 'blur(0)',
                transition: SWAP_TRANSITION,
              }}
            >
              <Flex position="relative" flexShrink={1} minWidth={12}>
                {/* Invisible twin sizes this wrapper to the typed text so the .uni.eth suffix hugs the
                    name and adjusts as the user types, on every browser. */}
                <Text {...VALUE_FONT_PROPS} fontSize={fontSize} numberOfLines={1} opacity={0} aria-hidden>
                  {renderedValue}
                </Text>
                <TextInput
                  ref={inputRef}
                  {...VALUE_FONT_PROPS}
                  fontSize={fontSize}
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={-CARET_SLACK}
                  right={-CARET_SLACK}
                  px={CARET_SLACK}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  spellCheck={false}
                  backgroundColor="$transparent"
                  borderWidth="$none"
                  py="$none"
                  placeholderTextColor="$neutral3"
                  testID={TestID.WalletNameInput}
                  maxLength={MAX_UNITAG_LENGTH}
                  value={renderedValue}
                  onChangeText={handleChangeText}
                />
              </Flex>
              <Text {...VALUE_FONT_PROPS} fontSize={fontSize} color="$neutral3" numberOfLines={1}>
                {UNITAG_SUFFIX}
              </Text>
            </Flex>
            <Trace logPress element={ElementName.Shuffle}>
              <TouchableArea testID={TestID.ShuffleUnitag} disabled={isShuffling} p="$spacing8" onPress={onShuffle}>
                <Shuffle color="$neutral2" size="$icon.24" />
              </TouchableArea>
            </Trace>
          </Flex>
        </Flex>
      </Flex>
      {error && (
        <Text color="$statusCritical" variant="body3" pl={ERROR_INDENT}>
          {error}
        </Text>
      )}
    </Flex>
  )
}

import { useCallback, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { InputWithSuffixProps } from 'src/features/import/InputWIthSuffixProps'
import { Flex } from 'ui/src'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const EPS = 1

export default function InputWithSuffix({
  alwaysShowInputSuffix = false,
  value,
  inputSuffix,
  inputSuffixColor,
  inputAlignment: inputAlignmentProp,
  inputFontSize,
  inputMaxFontSizeMultiplier,
  multiline = true,
  textAlign,
  textInputRef,
  lineHeight,
  ...inputProps
}: InputWithSuffixProps): JSX.Element {
  const textInputWidth = useRef<number>(0)
  const [shouldWrapLine, setShouldWrapLine] = useState(false)

  const measureMaxWidth = useCallback((e: LayoutChangeEvent) => {
    textInputWidth.current = e.nativeEvent.layout.width
  }, [])

  const measureInputWidth = useCallback(
    (e: LayoutChangeEvent) => {
      if (multiline) {
        const contentWidth = e.nativeEvent.layout.width
        const maxContentWidth = textInputWidth.current
        // Check if the input content doesn't fit in a single line
        // (add EPS to avoid rounding errors)
        setShouldWrapLine(contentWidth + EPS >= maxContentWidth)
      }
    },
    [multiline],
  )

  const isInputEmpty = !value?.length
  // On iOS use just the multiline prop to determine if the input should wrap
  // On Android, wrap the input only if it's content doesn't fit in a single line
  // and the input is multiline
  const isMultiline = multiline && shouldWrapLine

  const fallbackTextInputAlignment = inputAlignmentProp === 'flex-start' ? 'left' : 'center'
  const textInputAlignment = textAlign ?? fallbackTextInputAlignment

  const suffix =
    inputSuffix && (alwaysShowInputSuffix || (value && !value.includes(inputSuffix))) ? (
      <TextInput
        backgroundColor="$transparent"
        color={inputSuffixColor ?? '$neutral2'}
        editable={false}
        fontSize={inputFontSize}
        lineHeight={lineHeight}
        height={inputFontSize * 1.3}
        maxFontSizeMultiplier={inputMaxFontSizeMultiplier}
        px="$none"
        py="$none"
        scrollEnabled={false}
        value={inputSuffix}
      />
    ) : null

  return (
    <Flex row alignItems={isMultiline ? 'flex-end' : 'center'} justifyContent={inputAlignmentProp} overflow="hidden">
      {/* 
        Helper Flex to measure the max width of the input and switch to multiline if needed
        (multiline input behavior on Android is weird and the input flickers when the width
        of the TextInput component changes. As a workaround, we measure the max width of the input
        and switch to multiline if the content doesn't fit in a single line)
      */}
      <Flex row opacity={0} position="absolute" width="100%">
        <Flex grow onLayout={measureMaxWidth} />
        {suffix}
      </Flex>

      <TextInput
        ref={textInputRef}
        autoFocus
        autoCapitalize="none"
        backgroundColor="$transparent"
        color="$neutral1"
        fontSize={inputFontSize}
        lineHeight={lineHeight}
        maxFontSizeMultiplier={inputMaxFontSizeMultiplier}
        multiline={isMultiline}
        px="$none"
        py="$none"
        returnKeyType="done"
        scrollEnabled={false}
        spellCheck={false}
        testID={TestID.ImportAccountInput}
        textAlign={isInputEmpty ? 'left' : textInputAlignment}
        value={value}
        verticalAlign="center"
        style={{ flexShrink: 1 }}
        onLayout={measureInputWidth}
        {...inputProps}
      />
      {suffix}
    </Flex>
  )
}

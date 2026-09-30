import { Flex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { InputWithSuffixProps } from 'src/features/import/InputWIthSuffixProps'
import { TextInput } from 'uniswap/src/components/input/TextInput'

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
  const isInputEmpty = !value?.length

  const fallbackTextInputAlignment = inputAlignmentProp === 'flex-start' ? 'left' : 'center'
  const textInputAlignment = textAlign ?? fallbackTextInputAlignment

  return (
    <Flex row alignItems="flex-end" justifyContent={inputAlignmentProp}>
      <TextInput
        ref={textInputRef}
        autoFocus
        autoCapitalize="none"
        backgroundColor="$transparent"
        color="$neutral1"
        flexShrink={1}
        fontSize={inputFontSize}
        lineHeight={lineHeight}
        maxFontSizeMultiplier={inputMaxFontSizeMultiplier}
        multiline={multiline}
        px="$none"
        py="$none"
        returnKeyType="done"
        scrollEnabled={false}
        spellCheck={false}
        testID={TestID.ImportAccountInput}
        textAlign={isInputEmpty ? 'left' : textInputAlignment}
        value={value}
        {...inputProps}
      />
      {inputSuffix && (alwaysShowInputSuffix || (value && !value.includes(inputSuffix))) ? (
        <TextInput
          backgroundColor="$transparent"
          color={inputSuffixColor ?? '$neutral2'}
          editable={false}
          fontSize={inputFontSize}
          lineHeight={lineHeight}
          maxFontSizeMultiplier={inputMaxFontSizeMultiplier}
          multiline={multiline}
          px="$none"
          py="$none"
          scrollEnabled={false}
          value={inputSuffix}
        />
      ) : null}
    </Flex>
  )
}

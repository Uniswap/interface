import { fonts } from 'ui/src/theme'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'

const MAX_REPORT_TEXT_LENGTH = 500

export function ReportInput({
  setReportText,
  placeholder,
}: {
  placeholder: TextInputProps['placeholder']
  setReportText: TextInputProps['onChangeText']
}): JSX.Element {
  return (
    <TextInput
      multiline
      fontFamily="$body"
      fontSize={fonts.body3.fontSize}
      fontWeight={fonts.body3.fontWeight}
      borderRadius="$rounded12"
      placeholder={placeholder}
      py="$spacing12"
      backgroundColor="$surface2"
      numberOfLines={3}
      minHeight={96}
      maxLength={MAX_REPORT_TEXT_LENGTH}
      width="100%"
      returnKeyType="done"
      onChangeText={setReportText}
    />
  )
}

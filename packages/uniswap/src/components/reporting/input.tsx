import { fonts } from 'ui/src/theme'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'
import { isMobileApp } from 'utilities/src/platform'

export function ReportInput({
  setReportText,
  placeholder,
}: {
  placeholder: TextInputProps['placeholder']
  setReportText: TextInputProps['onChangeText']
}): JSX.Element {
  return (
    <TextInput
      multiline={!isMobileApp}
      fontFamily="$body"
      fontSize={fonts.body3.fontSize}
      fontWeight={fonts.body3.fontWeight}
      borderRadius="$rounded12"
      placeholder={placeholder}
      py="$spacing12"
      backgroundColor="$surface2"
      numberOfLines={3}
      width="100%"
      returnKeyType="done"
      onChangeText={setReportText}
    />
  )
}

import { borderRadii, spacing, fonts } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import type { ReportInputProps } from 'uniswap/src/components/reporting/input'

const MAX_REPORT_TEXT_LENGTH = 500
const MIN_INPUT_HEIGHT = 96

export function ReportInput({ setReportText, placeholder }: ReportInputProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <BottomSheetTextInput
      multiline
      autoComplete="off"
      maxLength={MAX_REPORT_TEXT_LENGTH}
      numberOfLines={3}
      placeholder={placeholder}
      placeholderTextColor={colors.neutral3.val}
      returnKeyType="done"
      selectionColor={colors.neutral3.val}
      style={{
        width: '100%',
        minHeight: MIN_INPUT_HEIGHT,
        color: colors.neutral1.val,
        backgroundColor: colors.surface2.val,
        borderRadius: borderRadii.rounded12,
        paddingHorizontal: spacing.spacing16,
        paddingVertical: spacing.spacing12,
        fontSize: fonts.body3.fontSize,
        fontFamily: fonts.body3.family,
      }}
      onChangeText={setReportText}
    />
  )
}

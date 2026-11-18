import { DeadlineInlineInput } from '@universe/transactions-ui'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'

export function DeadlineControl(): JSX.Element {
  const { inputDeadline, currentDeadline, onChangeDeadlineInput, onFocusDeadlineInput, onBlurDeadlineInput } =
    useDeadlineSettings()

  return (
    <DeadlineInlineInput
      value={inputDeadline}
      minutes={currentDeadline}
      onChangeValue={onChangeDeadlineInput}
      onFocus={onFocusDeadlineInput}
      onBlur={onBlurDeadlineInput}
    />
  )
}

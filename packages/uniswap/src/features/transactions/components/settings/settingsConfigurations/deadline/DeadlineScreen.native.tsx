import { DeadlineScreen as DeadlineScreenView } from '@universe/transactions-ui'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { MAX_CUSTOM_DEADLINE, MIN_CUSTOM_DEADLINE } from 'uniswap/src/constants/transactions'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { PlusMinusButtonType } from 'uniswap/src/features/transactions/components/settings/PlusMinusButton'
import { DeadlineWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineWarning'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'
import { openUri } from 'uniswap/src/utils/linking'

// LearnMoreLink's TouchableTextLink opened the article outside the app, with Linking.openURL.
const onPressLearnMore = (): Promise<void> =>
  openUri({ uri: UniswapHelpUrls.articles.swapDeadline, openExternalBrowser: true })

export function DeadlineScreen(): JSX.Element {
  const {
    inputDeadline,
    currentDeadline,
    onChangeDeadlineInput,
    onFocusDeadlineInput,
    onBlurDeadlineInput,
    onPressPlusMinusButton,
  } = useDeadlineSettings()

  function onPressIncrement(): void {
    onPressPlusMinusButton(PlusMinusButtonType.Plus)
  }

  function onPressDecrement(): void {
    onPressPlusMinusButton(PlusMinusButtonType.Minus)
  }

  return (
    <DeadlineScreenView
      value={inputDeadline}
      minutes={currentDeadline}
      isAtMinimum={currentDeadline <= MIN_CUSTOM_DEADLINE}
      isAtMaximum={currentDeadline >= MAX_CUSTOM_DEADLINE}
      TextInputComponent={BottomSheetTextInput}
      warning={<DeadlineWarning />}
      onChangeValue={onChangeDeadlineInput}
      onFocus={onFocusDeadlineInput}
      onBlur={onBlurDeadlineInput}
      onPressIncrement={onPressIncrement}
      onPressDecrement={onPressDecrement}
      onPressLearnMore={onPressLearnMore}
    />
  )
}

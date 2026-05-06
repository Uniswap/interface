import { useTranslation } from 'react-i18next'
import { Flex, PlusMinusButton, PlusMinusButtonType, Text, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { MAX_CUSTOM_DEADLINE, MIN_CUSTOM_DEADLINE } from 'uniswap/src/constants/transactions'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DeadlineWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/DeadlineWarning'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'

export function DeadlineScreen(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    isEditingDeadline,
    inputDeadline,
    currentDeadline,
    onChangeDeadlineInput,
    onFocusDeadlineInput,
    onBlurDeadlineInput,
    onPressPlusMinusButton,
  } = useDeadlineSettings()

  return (
    <Flex centered gap="$spacing16">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {t('swap.settings.deadline.tooltip')}
      </Text>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapDeadline} />
      <Flex gap="$spacing12">
        <Flex centered row gap="$spacing16" mt="$spacing12">
          <PlusMinusButton
            disabled={currentDeadline <= MIN_CUSTOM_DEADLINE}
            type={PlusMinusButtonType.Minus}
            onPress={onPressPlusMinusButton}
          />
          <Flex
            row
            alignItems="center"
            backgroundColor={isEditingDeadline ? '$surface2' : '$surface1'}
            borderColor="$surface3"
            borderRadius="$roundedFull"
            borderWidth="$spacing1"
            gap="$spacing8"
            p="$spacing16"
          >
            <BottomSheetTextInput
              keyboardType="numeric"
              style={{
                color: colors.neutral1.val,
                fontSize: fonts.subheading1.fontSize,
                width: fonts.subheading1.fontSize * 3,
                padding: spacing.none,
                fontFamily: fonts.subheading1.family,
              }}
              textAlign="right"
              value={inputDeadline}
              onBlur={onBlurDeadlineInput}
              onChangeText={onChangeDeadlineInput}
              onFocus={onFocusDeadlineInput}
            />
            <Text color="$neutral2" variant="subheading1">
              {t('common.minutes.lowercase', { count: currentDeadline })}
            </Text>
          </Flex>
          <PlusMinusButton
            disabled={currentDeadline >= MAX_CUSTOM_DEADLINE}
            type={PlusMinusButtonType.Plus}
            onPress={onPressPlusMinusButton}
          />
        </Flex>
        <Flex centered>
          <DeadlineWarning />
        </Flex>
      </Flex>
    </Flex>
  )
}

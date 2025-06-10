import { Settings } from 'components/Icons/Settings'
import { Trans, useTranslation } from 'react-i18next'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { ThemedText } from 'theme/components'
import { Flex, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import validateUserSlippageTolerance, { SlippageValidationResult } from 'utils/validateUserSlippageTolerance'

const ButtonContent = ({ compact }: { compact: boolean }) => {
  const [userSlippageTolerance] = useUserSlippageTolerance()
  const { formatPercent } = useLocalizationContext()

  if (userSlippageTolerance === SlippageTolerance.Auto) {
    return (
      <Flex row px="spacing6" py="spacing12" borderRadius="$rounded16">
        <Settings height="24px" width="24px" fill="neutral2" />
      </Flex>
    )
  }

  const isInvalidSlippage = validateUserSlippageTolerance(userSlippageTolerance) !== SlippageValidationResult.Valid

  return (
    <Flex
      row
      px="$spacing6"
      py="$spacing12"
      borderRadius="$rounded16"
      data-testid="settings-icon-with-slippage"
      gap="$gap8"
      backgroundColor={isInvalidSlippage ? '$statusWarning2' : '$surface2'}
    >
      <ThemedText.Caption color={isInvalidSlippage ? 'accentWarning' : 'neutral2'}>
        {compact ? (
          formatPercent(userSlippageTolerance.toSignificant())
        ) : (
          <Trans i18nKey="swap.slippage.amt" values={{ amt: formatPercent(userSlippageTolerance.toSignificant()) }} />
        )}
      </ThemedText.Caption>
      <Settings height="24px" width="24px" fill="neutral2" />
    </Flex>
  )
}

export default function MenuButton({
  disabled,
  onClick,
  isActive,
  compact,
}: {
  disabled: boolean
  onClick: () => void
  isActive: boolean
  compact: boolean
}) {
  const { t } = useTranslation()
  return (
    <TouchableArea
      disabled={disabled}
      onPress={onClick}
      id="open-settings-dialog-button"
      data-testid="open-settings-dialog-button"
      aria-label={t('common.transactionSettings')}
      hoverStyle={{
        opacity: 0.7,
      }}
      opacity={isActive ? 0.7 : 1}
    >
      <ButtonContent compact={compact} />
    </TouchableArea>
  )
}

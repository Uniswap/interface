import { Settings } from 'components/Icons/Settings'
import styled from 'lib/styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { useFormatter } from 'utils/formatNumbers'
import validateUserSlippageTolerance, { SlippageValidationResult } from 'utils/validateUserSlippageTolerance'

const Button = styled.button<{ isActive: boolean }>`
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  cursor: pointer;
  outline: none;

  :not([disabled]):hover {
    opacity: 0.7;
  }

  ${({ isActive }) => isActive && `opacity: 0.7`}
`

const ButtonContent = ({ compact }: { compact: boolean }) => {
  const [userSlippageTolerance] = useUserSlippageTolerance()
  const { formatPercent } = useFormatter()

  if (userSlippageTolerance === SlippageTolerance.Auto) {
    return (
      <Flex row p="6px 12px" borderRadius="16px">
        <Settings height="24px" width="24px" fill="neutral2" />
      </Flex>
    )
  }

  const isInvalidSlippage = validateUserSlippageTolerance(userSlippageTolerance) !== SlippageValidationResult.Valid

  return (
    <Flex
      row
      p="6px 12px"
      borderRadius="16px"
      data-testid="settings-icon-with-slippage"
      gap="sm"
      backgroundColor={isInvalidSlippage ? 'accentWarningSoft' : 'surface2'}
    >
      <ThemedText.Caption color={isInvalidSlippage ? 'accentWarning' : 'neutral2'}>
        {compact ? (
          formatPercent(userSlippageTolerance)
        ) : (
          <Trans i18nKey="swap.slippage.amt" values={{ amt: formatPercent(userSlippageTolerance) }} />
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
    <Button
      disabled={disabled}
      onClick={onClick}
      isActive={isActive}
      id="open-settings-dialog-button"
      data-testid="open-settings-dialog-button"
      aria-label={t('common.transactionSettings')}
    >
      <ButtonContent compact={compact} />
    </Button>
  )
}

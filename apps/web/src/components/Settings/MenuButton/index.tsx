import { Settings } from 'components/Icons/Settings'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'
import validateUserSlippageTolerance, { SlippageValidationResult } from 'utils/validateUserSlippageTolerance'

const Icon = styled(Settings)`
  height: 24px;
  width: 24px;
  > * {
    fill: ${({ theme }) => theme.neutral2};
  }
`

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

const IconContainer = styled(Row)`
  padding: 6px 12px;
  border-radius: 16px;
`

const IconContainerWithSlippage = styled(IconContainer)<{ displayWarning?: boolean }>`
  div {
    color: ${({ theme, displayWarning }) => (displayWarning ? theme.deprecated_accentWarning : theme.neutral2)};
  }

  background-color: ${({ theme, displayWarning }) =>
    displayWarning ? theme.deprecated_accentWarningSoft : theme.surface2};
`

const ButtonContent = ({ trade, compact }: { trade?: InterfaceTrade; compact: boolean }) => {
  const [userSlippageTolerance] = useUserSlippageTolerance()
  const { formatPercent } = useFormatter()

  if (userSlippageTolerance === SlippageTolerance.Auto || isUniswapXTrade(trade)) {
    return (
      <IconContainer>
        <Icon />
      </IconContainer>
    )
  }

  const isInvalidSlippage = validateUserSlippageTolerance(userSlippageTolerance) !== SlippageValidationResult.Valid

  return (
    <IconContainerWithSlippage data-testid="settings-icon-with-slippage" gap="sm" displayWarning={isInvalidSlippage}>
      <ThemedText.Caption>
        {compact ? (
          formatPercent(userSlippageTolerance)
        ) : (
          <Trans i18nKey="swap.slippage.amt" values={{ amt: formatPercent(userSlippageTolerance) }} />
        )}
      </ThemedText.Caption>
      <Icon />
    </IconContainerWithSlippage>
  )
}

export default function MenuButton({
  disabled,
  onClick,
  isActive,
  compact,
  trade,
}: {
  disabled: boolean
  onClick: () => void
  isActive: boolean
  compact: boolean
  trade?: InterfaceTrade
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
      <ButtonContent trade={trade} compact={compact} />
    </Button>
  )
}

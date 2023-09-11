import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { Settings } from 'components/Icons/Settings'
import Row from 'components/Row'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import styled from 'styled-components'
import { ThemedText } from 'theme'
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
  padding: 4px 4px 4px 12px;
  border-radius: 16px;
`

const IconContainerWithSlippage = styled(IconContainer)<{ displayWarning?: boolean }>`
  div {
    color: ${({ theme, displayWarning }) => (displayWarning ? theme.neutral2 : theme.neutral2)};
  }

  background-color: ${({ theme, displayWarning }) => (displayWarning ? theme.surface2 : theme.surface2)};
`

const MAXIMUM_RECOMMENDED_SLIPPAGE = new Percent(1, 100)

const ButtonContent = () => {
  const [userSlippageTolerance] = useUserSlippageTolerance()

  if (userSlippageTolerance === SlippageTolerance.Auto) {
    return (
      <IconContainer>
        <Icon />
      </IconContainer>
    )
  }

  // const tooLow = userSlippageTolerance !== userSlippageTolerance.lessThan(MINIMUM_RECOMMENDED_SLIPPAGE)
  const tooHigh = userSlippageTolerance.greaterThan(MAXIMUM_RECOMMENDED_SLIPPAGE)

  const isInvalidSlippage = validateUserSlippageTolerance(userSlippageTolerance) !== SlippageValidationResult.Valid

  return (
    <IconContainerWithSlippage data-testid="settings-icon-with-slippage" gap="sm" displayWarning={isInvalidSlippage}>
      {tooHigh && <AlertTriangleFilled />}

      <ThemedText.BodySmall>
        <Trans>{userSlippageTolerance.toFixed(2)}% slippage</Trans>
      </ThemedText.BodySmall>
      <Icon />
    </IconContainerWithSlippage>
  )
}

export default function MenuButton({
  disabled,
  onClick,
  isActive,
}: {
  disabled: boolean
  onClick: () => void
  isActive: boolean
}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      isActive={isActive}
      id="open-settings-dialog-button"
      data-testid="open-settings-dialog-button"
      aria-label={t`Transaction Settings`}
    >
      <ButtonContent />
    </Button>
  )
}

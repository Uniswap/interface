import { t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Row from 'components/Row'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { Settings } from 'react-feather'
import { useToggleSettingsMenu } from 'state/application/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import validateUserSlippageTolerance, { SlippageValidationResponse } from 'utils/validateUserSlippageTolerance'

const Icon = styled(Settings)`
  height: 20px;
  width: 20px;
  > * {
    stroke: ${({ theme }) => theme.textSecondary};
  }
`

const Button = styled.button<{ disabled: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  border-radius: 0.5rem;
  ${({ disabled }) =>
    !disabled &&
    `
    :hover,
    :focus {
      cursor: pointer;
      outline: none;
      opacity: 0.7;
    }
  `}
`

const IconContainer = styled(Row)`
  padding: 6px 12px;
  border-radius: 16px;
`

const IconContainerWithSlippage = styled(IconContainer)<{ displayWarning?: boolean }>`
  div {
    color: ${({ theme, displayWarning }) => (displayWarning ? theme.accentWarning : theme.textSecondary)};
  }

  background-color: ${({ theme, displayWarning }) =>
    displayWarning ? theme.accentWarningSoft : theme.backgroundModule};
`

const ButtonIcon = () => {
  const [userSlippageTolerance] = useUserSlippageTolerance()

  if (userSlippageTolerance === SlippageTolerance.Auto) {
    return (
      <IconContainer>
        <Icon />
      </IconContainer>
    )
  }

  const isInvalidSlippage = validateUserSlippageTolerance(userSlippageTolerance) !== SlippageValidationResponse.Valid

  return (
    <IconContainerWithSlippage gap="sm" displayWarning={isInvalidSlippage}>
      <ThemedText.Caption>{userSlippageTolerance.toFixed(2)}% slippage</ThemedText.Caption>
      <Icon />
    </IconContainerWithSlippage>
  )
}

export default function MenuButton() {
  const { chainId } = useWeb3React()

  const toggle = useToggleSettingsMenu()

  return (
    <Button
      disabled={!isSupportedChainId(chainId)}
      onClick={toggle}
      id="open-settings-dialog-button"
      data-testid="open-settings-dialog-button"
      aria-label={t`Transaction Settings`}
    >
      <ButtonIcon />
    </Button>
  )
}

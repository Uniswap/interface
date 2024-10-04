import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button/buttons'
import { AutoColumn } from 'components/deprecated/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import TokenSafetyLabel from 'components/TokenSafety/TokenSafetyLabel'
import {
  displayWarningLabel,
  getWarningCopy,
  StrongWarning,
  TOKEN_SAFETY_ARTICLE,
  useTokenWarning,
  Warning,
} from 'constants/deprecatedTokenSafety'
import styled from 'lib/styled-components'
import { Text } from 'rebass'
import { ButtonText, ExternalLink } from 'theme/components'
import { ExplorerView } from 'uniswap/src/features/address/ExplorerView'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { Trans } from 'uniswap/src/i18n'

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const Container = styled.div`
  width: 100%;
  padding: 32px 40px;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const LogoContainer = styled.div`
  display: flex;
  gap: 16px;
`

const ShortColumn = styled(AutoColumn)`
  margin-top: 10px;
`

const InfoText = styled(Text)`
  padding: 0 12px 0 12px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
`

const StyledButton = styled(ButtonPrimary)`
  margin-top: 24px;
  width: 100%;
  font-weight: 535;
`

const StyledCancelButton = styled(ButtonText)`
  margin-top: 16px;
  color: ${({ theme }) => theme.neutral2};
  font-weight: 535;
  font-size: 14px;
`

const StyledCloseButton = styled(StyledButton)`
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral1};

  &:hover {
    background-color: ${({ theme }) => theme.surface3};
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: opacity 250ms ease;
  }
`

const Buttons = ({
  warning,
  onContinue,
  onCancel,
  onBlocked,
  showCancel,
}: {
  warning: Warning
  onContinue?: () => void
  onCancel: () => void
  onBlocked?: () => void
  showCancel?: boolean
}) => {
  return warning.canProceed ? (
    <>
      <StyledButton onClick={onContinue}>
        {!displayWarningLabel(warning) ? (
          <Trans i18nKey="common.button.continue" />
        ) : (
          <Trans i18nKey="common.button.understand" />
        )}
      </StyledButton>
      {showCancel && <StyledCancelButton onClick={onCancel}>Cancel</StyledCancelButton>}
    </>
  ) : (
    <StyledCloseButton onClick={onBlocked ?? onCancel}>
      <Trans i18nKey="common.close" />
    </StyledCloseButton>
  )
}

const SafetyLabel = ({ warning }: { warning: Warning }) => {
  return (
    <TokenSafetyLabel level={warning.level} canProceed={warning.canProceed}>
      {warning.message}
    </TokenSafetyLabel>
  )
}

// TODO: Replace color with stylesheet color
const LinkColumn = styled(AutoColumn)`
  width: 100%;
  margin-top: 16px;
  position: relative;
`

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.accent1};
  stroke: currentColor;
  font-weight: 535;
`

export interface TokenSafetyProps {
  token0: Token
  token1?: Token
  onAcknowledge: () => void
  closeModalOnly: () => void
  onBlocked?: () => void
  showCancel?: boolean
}

export default function TokenSafety({
  token0,
  token1,
  onAcknowledge,
  closeModalOnly: onClose,
  onBlocked,
  showCancel,
}: TokenSafetyProps) {
  const logos = []
  const urls = []

  const token0Warning = useTokenWarning(token0?.address, token0?.chainId)
  const token1Warning = useTokenWarning(token1?.address, token1?.chainId)

  const token0Unsupported = !token0Warning?.canProceed
  const token1Unsupported = !token1Warning?.canProceed

  // Logic for only showing the 'unsupported' warning if one is supported and other isn't
  if (token0 && token0Warning && (token0Unsupported || !(token1Warning && token1Unsupported))) {
    logos.push(<CurrencyLogo key={token0.address} currency={token0} size={48} />)
    urls.push(<ExplorerView currency={token0} modalName={ModalName.TokenWarningModal} />)
  }
  if (token1 && token1Warning && (token1Unsupported || !(token0Warning && token0Unsupported))) {
    logos.push(<CurrencyLogo key={token1.address} currency={token1} size={48} />)
    urls.push(<ExplorerView currency={token1} modalName={ModalName.TokenWarningModal} />)
  }

  const plural = logos.length > 1
  // Show higher level warning if two are present
  let displayWarning = token0Warning
  if (!token0Warning || (token1Warning && token1Unsupported && !token0Unsupported)) {
    displayWarning = token1Warning
  }

  // dismiss token warnings on acknowledgement
  const { onDismissTokenWarning: onDismissToken0 } = useDismissedTokenWarnings(token0)
  const { onDismissTokenWarning: onDismissToken1 } = useDismissedTokenWarnings(token1)
  const acknowledge = () => {
    onDismissToken0()
    onDismissToken1()
    onAcknowledge()
  }

  const { heading, description } = getWarningCopy(displayWarning, plural)
  const learnMoreUrl = (
    <StyledExternalLink href={TOKEN_SAFETY_ARTICLE}>
      <Trans i18nKey="common.button.learn" />
    </StyledExternalLink>
  )

  return displayWarning ? (
    <Wrapper data-testid="TokenSafetyWrapper">
      <Container>
        <AutoColumn>
          <LogoContainer>{logos}</LogoContainer>
        </AutoColumn>
        {displayWarningLabel(displayWarning) && (
          <ShortColumn>
            <SafetyLabel warning={displayWarning} />
          </ShortColumn>
        )}
        <ShortColumn>
          <InfoText>
            {heading} {description} {learnMoreUrl}
          </InfoText>
        </ShortColumn>
        <LinkColumn>{urls}</LinkColumn>
        <Buttons
          warning={displayWarning}
          onContinue={acknowledge}
          onCancel={onClose}
          onBlocked={onBlocked}
          showCancel={showCancel}
        />
      </Container>
    </Wrapper>
  ) : (
    <Wrapper>
      <Container>
        <ShortColumn>
          <SafetyLabel warning={StrongWarning} />
        </ShortColumn>
        <ShortColumn>
          <InfoText>
            {heading} {description} {learnMoreUrl}
          </InfoText>
        </ShortColumn>
        <Buttons warning={StrongWarning} onCancel={onClose} showCancel={true} />
      </Container>
    </Wrapper>
  )
}

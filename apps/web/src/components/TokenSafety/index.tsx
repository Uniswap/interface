import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import TokenSafetyLabel from 'components/TokenSafety/TokenSafetyLabel'
import {
  displayWarningLabel,
  getWarningCopy,
  StrongWarning,
  TOKEN_SAFETY_ARTICLE,
  useTokenWarning,
  Warning,
} from 'constants/tokenSafety'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { ExternalLink as LinkIconFeather } from 'react-feather'
import { Text } from 'rebass'
import { useAddUserToken } from 'state/user/hooks'
import { ButtonText, CopyLinkIcon, ExternalLink } from 'theme/components'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

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
          <Trans i18nKey="common.continue.button" />
        ) : (
          <Trans i18nKey="common.acknowledge" />
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

const ExplorerContainer = styled.div`
  width: 100%;
  height: 32px;
  margin-top: 10px;
  font-size: 20px;
  background-color: ${({ theme }) => theme.accent2};
  color: ${({ theme }) => theme.accent1};
  border-radius: 8px;
  padding: 2px 12px;
  display: flex;
  align-items: center;
  overflow: hidden;
`

const ExplorerLinkWrapper = styled.div`
  display: flex;
  overflow: hidden;
  align-items: center;
  cursor: pointer;

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  :active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const ExplorerLink = styled.div`
  display: block;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
const ExplorerLinkIcon = styled(LinkIconFeather)`
  height: 16px;
  width: 18px;
  margin-left: 8px;
`

const LinkIconWrapper = styled.div`
  justify-content: center;
  display: flex;
`

function ExternalLinkIcon() {
  return (
    <LinkIconWrapper>
      <ExplorerLinkIcon />
    </LinkIconWrapper>
  )
}

function ExplorerView({ token }: { token: Token }) {
  if (token) {
    const explorerLink = getExplorerLink(token?.chainId, token?.address, ExplorerDataType.TOKEN)
    return (
      <ExplorerContainer>
        <ExplorerLinkWrapper onClick={() => window.open(explorerLink, '_blank')}>
          <ExplorerLink>{explorerLink}</ExplorerLink>
          <ExternalLinkIcon />
        </ExplorerLinkWrapper>
        <CopyLinkIcon toCopy={explorerLink} />
      </ExplorerContainer>
    )
  } else {
    return null
  }
}

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.accent1};
  stroke: currentColor;
  font-weight: 535;
`

export interface TokenSafetyProps {
  token0?: Token
  token1?: Token
  onContinue: () => void
  onCancel: () => void
  onBlocked?: () => void
  showCancel?: boolean
}

export default function TokenSafety({ token0, token1, onContinue, onCancel, onBlocked, showCancel }: TokenSafetyProps) {
  const logos = []
  const urls = []

  const token0Warning = useTokenWarning(token0?.address, token0?.chainId)
  const token1Warning = useTokenWarning(token1?.address, token1?.chainId)

  const token0Unsupported = !token0Warning?.canProceed
  const token1Unsupported = !token1Warning?.canProceed

  // Logic for only showing the 'unsupported' warning if one is supported and other isn't
  if (token0 && token0Warning && (token0Unsupported || !(token1Warning && token1Unsupported))) {
    logos.push(<CurrencyLogo key={token0.address} currency={token0} size={48} />)
    urls.push(<ExplorerView token={token0} />)
  }
  if (token1 && token1Warning && (token1Unsupported || !(token0Warning && token0Unsupported))) {
    logos.push(<CurrencyLogo key={token1.address} currency={token1} size={48} />)
    urls.push(<ExplorerView token={token1} />)
  }

  const plural = logos.length > 1
  // Show higher level warning if two are present
  let displayWarning = token0Warning
  if (!token0Warning || (token1Warning && token1Unsupported && !token0Unsupported)) {
    displayWarning = token1Warning
  }

  // If a warning is acknowledged, import these tokens
  const addToken = useAddUserToken()
  const acknowledge = () => {
    if (token0) {
      addToken(token0)
    }
    if (token1) {
      addToken(token1)
    }
    onContinue()
  }

  const { heading, description } = getWarningCopy(displayWarning, plural)
  const learnMoreUrl = (
    <StyledExternalLink href={TOKEN_SAFETY_ARTICLE}>
      <Trans i18nKey="common.learnMore.link" />
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
          onCancel={onCancel}
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
        <Buttons warning={StrongWarning} onCancel={onCancel} showCancel={true} />
      </Container>
    </Wrapper>
  )
}

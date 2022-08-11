import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenSafetyLabel from 'components/TokenSafety/TokenSafetyLabel'
import { checkWarning, getWarningCopy, TOKEN_SAFETY_ARTICLE, Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { useToken } from 'hooks/Tokens'
import { ExternalLink as LinkIconFeather } from 'react-feather'
import { Text } from 'rebass'
import { useAddUserToken } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ButtonText, CopyLinkIcon, ExternalLink } from 'theme'
import { Color } from 'theme/styled'
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
  padding: 32px 50px;
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

const StyledButton = styled(ButtonPrimary)<{ buttonColor: Color; textColor: Color }>`
  color: ${({ textColor }) => textColor};
  background-color: ${({ buttonColor }) => buttonColor};
  margin-top: 24px;
  width: 100%;
  :hover {
    background-color: ${({ buttonColor, theme }) => buttonColor ?? theme.accentAction};
  }
`

const StyledCancelButton = styled(ButtonText)<{ color?: Color }>`
  margin-top: 16px;
  color: ${({ color, theme }) => color ?? theme.accentAction};
`

const Buttons = ({
  warning,
  onContinue,
  onCancel,
}: {
  warning: Warning
  onContinue: () => void
  onCancel: () => void
}) => {
  const theme = useTheme()
  let textColor, buttonColor, cancelColor
  switch (warning.level) {
    case WARNING_LEVEL.MEDIUM:
      textColor = theme.white
      buttonColor = theme.accentAction
      cancelColor = theme.accentAction
      break
    case WARNING_LEVEL.UNKNOWN:
      textColor = theme.accentFailure
      buttonColor = theme.accentFailureSoft
      cancelColor = theme.textPrimary
      break
    case WARNING_LEVEL.BLOCKED:
      textColor = theme.textPrimary
      buttonColor = theme.backgroundInteractive
      break
  }
  return warning.canProceed ? (
    <>
      <StyledButton buttonColor={buttonColor} textColor={textColor} onClick={onContinue}>
        <Trans>I Understand</Trans>
      </StyledButton>
      <StyledCancelButton color={cancelColor} onClick={onCancel}>
        Cancel
      </StyledCancelButton>
    </>
  ) : (
    <StyledButton buttonColor={buttonColor} textColor={textColor} onClick={onCancel}>
      <Trans>Close</Trans>
    </StyledButton>
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
  background-color: ${({ theme }) => theme.accentActiveSoft};
  color: ${({ theme }) => theme.accentActive};
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
    opacity: 0.6;
  }
  :active {
    opacity: 0.4;
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

export function ExternalLinkIcon() {
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

interface TokenSafetyProps {
  tokenAddress: string | null
  secondTokenAddress?: string
  onContinue: () => void
  onCancel: () => void
}

export default function TokenSafety({ tokenAddress, secondTokenAddress, onContinue, onCancel }: TokenSafetyProps) {
  const logos = []
  const urls = []

  const token1Warning = tokenAddress ? checkWarning(tokenAddress) : null
  const token1 = useToken(tokenAddress)
  const token2Warning = secondTokenAddress ? checkWarning(secondTokenAddress) : null
  const token2 = useToken(secondTokenAddress)

  const token1Unsupported = !token1Warning?.canProceed
  const token2Unsupported = !token2Warning?.canProceed

  // Logic for only showing the 'unsupported' warning if one is supported and other isn't
  if (token1 && token1Warning && (token1Unsupported || !(token2Warning && token2Unsupported))) {
    logos.push(<CurrencyLogo currency={token1} size="48px" />)
    urls.push(<ExplorerView token={token1} />)
  }
  if (token2 && token2Warning && (token2Unsupported || !(token1Warning && token1Unsupported))) {
    logos.push(<CurrencyLogo currency={token2} size="48px" />)
    urls.push(<ExplorerView token={token2} />)
  }

  const plural = logos.length > 1
  // Show higher level warning if two are present
  let displayWarning = token1Warning
  if (!token1Warning || (token2Warning && token2Unsupported && !token1Unsupported)) {
    displayWarning = token2Warning
  }

  // If a warning is acknowledged, import these tokens
  const addToken = useAddUserToken()
  const acknowledge = () => {
    if (token1) {
      addToken(token1)
    }
    if (token2) {
      addToken(token2)
    }
    onContinue()
  }

  const { heading, description } = getWarningCopy(displayWarning, plural)

  return (
    displayWarning && (
      <Wrapper>
        <Container>
          <AutoColumn>
            <LogoContainer>{logos}</LogoContainer>
          </AutoColumn>
          <ShortColumn>
            <SafetyLabel warning={displayWarning} />
          </ShortColumn>
          <ShortColumn>{heading && <InfoText fontSize="20px">{heading}</InfoText>}</ShortColumn>
          <ShortColumn>
            <InfoText>
              {description}{' '}
              <ExternalLink href={TOKEN_SAFETY_ARTICLE}>
                <Trans>Learn More</Trans>
              </ExternalLink>
            </InfoText>
          </ShortColumn>
          <LinkColumn>{urls}</LinkColumn>
          <Buttons warning={displayWarning} onContinue={acknowledge} onCancel={onCancel} />
        </Container>
      </Wrapper>
    )
  )
}

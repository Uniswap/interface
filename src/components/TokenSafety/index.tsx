import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenSafetyLabel from 'components/TokenSafety/TokenSafetyLabel'
import { checkWarning, getWarningCopy, Warning, WARNING_LEVEL } from 'constants/tokenWarnings'
import { useToken } from 'hooks/Tokens'
import { Text } from 'rebass'
import { useAddUserToken } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ButtonText, CopyLinkIcon, ExternalLinkIcon } from 'theme'
import { Color } from 'theme/styled'

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
      cancelColor = theme.white
      break
    case WARNING_LEVEL.BLOCKED:
      textColor = theme.white
      buttonColor = theme.accentAction
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
`

const URLWrapper = styled.div`
  width: 100%;
  height: 32px;
  margin-top: 10px;
  font-size: 20px;
  background-color: ${({ theme }) => theme.accentActionSoft};
  border-radius: 8px;
  padding: 2px 12px;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
`

const URL = styled(Text)`
  display: block;
  text-decoration: none;
  font-size: 14px;
  color: ${({ theme }) => theme.accentAction};
  overflow: hidden;
  text-overflow: ellipsis;
`

function EtherscanURL({ tokenAddress }: { tokenAddress: string | null | undefined }) {
  const learnMoreURL = 'https://etherscan.io/token/' + tokenAddress
  return (
    <URLWrapper>
      <URL>{learnMoreURL}</URL>
      <CopyLinkIcon toCopy={learnMoreURL} />
      <ExternalLinkIcon color="#4c82fb" href={learnMoreURL} />
    </URLWrapper>
  )
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
  if (token1Warning && (token1Unsupported || !(token2Warning && token2Unsupported))) {
    logos.push(<CurrencyLogo currency={token1} size="48px" />)
    urls.push(<EtherscanURL tokenAddress={tokenAddress} />)
  }
  if (token2Warning && (token2Unsupported || !(token1Warning && token1Unsupported))) {
    logos.push(<CurrencyLogo currency={token2} size="48px" />)
    urls.push(<EtherscanURL tokenAddress={secondTokenAddress} />)
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
              <b>
                <Trans>Learn More</Trans>
              </b>
            </InfoText>
          </ShortColumn>
          <LinkColumn>{urls}</LinkColumn>
          <Buttons warning={displayWarning} onContinue={acknowledge} onCancel={onCancel} />
        </Container>
      </Wrapper>
    )
  )
}

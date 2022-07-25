// import { Currency, Token } from '@uniswap/sdk-core'
// import { TokenList } from '@uniswap/token-lists'
// import usePrevious from 'hooks/usePrevious'
//import { Trans } from '@lingui/macro'
import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenSafetyLabel from 'components/TokenSafety/TokenSafetyLabel'
import { SAFETY_WARNING, Warning } from 'constants/tokenWarnings'
import { useCurrency } from 'hooks/Tokens'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'
import { ButtonText, CopyLinkIcon, ExternalLinkIcon } from 'theme'
import { Color } from 'theme/styled'

import Modal from '../Modal'

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

const ShortColumn = styled(AutoColumn)`
  margin-top: 8px;
`

const InfoText = styled(Text)`
  padding: 0 12px 0 12px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
`

// TODO: Replace color with stylesheet color
const LinkColumn = styled(AutoColumn)`
  width: 100%;
  height: 32px;
  margin-top: 24px;
  font-size: 20px;
  background-color: #4c82fb1f;
  border-radius: 8px;
  padding: 2px 12px;
  display: flex;
  align-items: center;
`

const EtherscanURL = styled(Text)`
  display: block;
  text-decoration: none;
  font-size: 14px;
  color: #4c82fb;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledButton = styled(ButtonPrimary)<{ buttonColor: Color; textColor: Color }>`
  color: ${({ textColor, theme }) => textColor};
  background-color: ${({ buttonColor, theme }) => buttonColor};
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
  let textColor, buttonColor, text, cancelColor
  switch (warning.level) {
    case SAFETY_WARNING.MEDIUM:
      text = 'I Understand'
      textColor = theme.white
      buttonColor = theme.accentAction
      cancelColor = theme.accentAction
      break
    case SAFETY_WARNING.UNKNOWN:
      text = 'I Understand'
      textColor = theme.accentFailure
      buttonColor = theme.accentFailureSoft
      cancelColor = theme.white
      break
    case SAFETY_WARNING.BLOCKED:
      text = 'Close'
      textColor = theme.white
      buttonColor = theme.accentAction
      break
  }
  return (
    <>
      <StyledButton buttonColor={buttonColor} textColor={textColor} onClick={onContinue}>
        <Trans>{text}</Trans>
      </StyledButton>
      {warning.canProceed && (
        <StyledCancelButton color={cancelColor} onClick={onCancel}>
          Cancel
        </StyledCancelButton>
      )}
    </>
  )
}

const SafetyLabel = ({ warning }: { warning: Warning }) => {
  return (
    <TokenSafetyLabel level={warning.level} canProceed={warning.canProceed}>
      {warning.message}
    </TokenSafetyLabel>
  )
}

interface TokenSafetyModalProps {
  isOpen: boolean
  warning: Warning | null | undefined
  tokenAddress: string
  onContinue: () => void
  onCancel: () => void
}

export default function TokenSafetyModal({
  isOpen,
  warning,
  tokenAddress,
  onContinue,
  onCancel,
}: TokenSafetyModalProps) {
  const currency = useCurrency(tokenAddress)
  const learnMoreURL = 'https://etherscan.io/token/' + tokenAddress

  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={80} minHeight={40}>
      {warning && (
        <Wrapper>
          <Container>
            <AutoColumn>
              <CurrencyLogo currency={currency} size="48px" />
            </AutoColumn>
            <ShortColumn>
              <SafetyLabel warning={warning} />
            </ShortColumn>
            <ShortColumn>
              <InfoText fontSize="20px">{warning.heading}</InfoText>
            </ShortColumn>
            <ShortColumn>
              <InfoText>
                {warning.description} <b>Learn More</b>
              </InfoText>
            </ShortColumn>
            <LinkColumn>
              <EtherscanURL href={learnMoreURL}>{learnMoreURL}</EtherscanURL>
              <CopyLinkIcon toCopy={learnMoreURL} />
              <ExternalLinkIcon color="#4c82fb" href={learnMoreURL} />
            </LinkColumn>
            <Buttons warning={warning} onContinue={onContinue} onCancel={onCancel} />
          </Container>
        </Wrapper>
      )}
    </Modal>
  )
}

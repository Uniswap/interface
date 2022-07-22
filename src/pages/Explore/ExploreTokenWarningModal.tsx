// import { Currency, Token } from '@uniswap/sdk-core'
// import { TokenList } from '@uniswap/token-lists'
// import usePrevious from 'hooks/usePrevious'
//import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenWarningLabel from 'components/TokenWarningLabel'
import { Warning } from 'constants/tokenWarnings'
import { useCurrency } from 'hooks/Tokens'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ButtonText, CopyLinkIcon, ExternalLinkIcon } from 'theme'
import { Color } from 'theme/styled'

import Modal from '../../components/Modal'

interface ExploreTokenWarningModalProps {
  isOpen: boolean
  warning: Warning | null | undefined
  tokenAddress: string
  onProceed?: () => void
  onCancel: () => void
}

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

const EtherscanLink = styled(Text)`
  display: block;
  text-decoration: none;
  font-size: 14px;
  color: #4c82fb;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledProceedButton = styled(ButtonPrimary)<{ color?: Color; buttonColor?: Color }>`
  color: ${({ color, theme }) => color ?? theme.white};
  background-color: ${({ buttonColor, theme }) => buttonColor ?? theme.primary1};
  margin-top: 24px;
  width: 100%;
  :hover {
    background-color: ${({ buttonColor, theme }) => buttonColor ?? theme.primary1};
  }
`
const StyledCloseButton = styled(ButtonPrimary)`
  margin-top: 24px;
  width: 100%;
`

const StyledCancelButton = styled(ButtonText)<{ color?: Color }>`
  margin-top: 16px;
  color: ${({ color, theme }) => color ?? theme.primary1};
`

export default function ExploreTokenWarningModal({
  isOpen,
  warning,
  tokenAddress,
  onProceed,
  onCancel,
}: ExploreTokenWarningModalProps) {
  const currency = useCurrency(tokenAddress)
  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={80} minHeight={40}>
      {warning && (
        <Wrapper>
          <Container>
            <AutoColumn>
              <CurrencyLogo currency={currency} size="48px" />
            </AutoColumn>
            <ShortColumn>
              <TokenWarningLabel warning={warning}></TokenWarningLabel>
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
              <EtherscanLink href={'https://etherscan.io/token/' + tokenAddress}>
                {'https://etherscan.io/token/' + tokenAddress}
              </EtherscanLink>
              <CopyLinkIcon toCopy={'https://etherscan.io/token/' + tokenAddress} />
              <ExternalLinkIcon color="#4c82fb" href={'https://etherscan.io/token/' + tokenAddress} />
            </LinkColumn>
            {warning.canProceed ? (
              <>
                <StyledProceedButton
                  color={warning.buttonTextColor}
                  buttonColor={warning.buttonColor}
                  onClick={onProceed}
                >
                  I Understand
                </StyledProceedButton>
                <StyledCancelButton color={warning.cancelTextColor} onClick={onCancel}>
                  Cancel
                </StyledCancelButton>
              </>
            ) : (
              <StyledCloseButton onClick={onCancel}>Close</StyledCloseButton>
            )}
          </Container>
        </Wrapper>
      )}
    </Modal>
  )
}

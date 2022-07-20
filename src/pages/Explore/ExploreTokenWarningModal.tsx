// import { Currency, Token } from '@uniswap/sdk-core'
// import { TokenList } from '@uniswap/token-lists'
// import usePrevious from 'hooks/usePrevious'
//import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenWarningLabel from 'components/TokenWarningLabel'
import { WARNING_TO_ATTRIBUTES, WarningTypes } from 'constants/tokenWarnings'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ButtonText, ExternalLinkIcon } from 'theme'

import Modal from '../../components/Modal'

interface ExploreTokenWarningModalProps {
  tokenAddress: string
  currency: Currency | null | undefined
  isOpen: boolean
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

const StyledProceedButton = styled(ButtonPrimary)`
  margin-top: 24px;
  width: 100%;
`
const StyledCloseButton = styled(ButtonPrimary)`
  margin-top: 24px;
  width: 100%;
`

const StyledCancelButton = styled(ButtonText)`
  margin-top: 16px;
  color: ${({ theme }) => theme.primary1};
`

export default function ExploreTokenWarningModal({
  tokenAddress,
  currency,
  isOpen,
  onProceed,
  onCancel,
}: ExploreTokenWarningModalProps) {
  const { heading, description } = WARNING_TO_ATTRIBUTES[WarningTypes.MEDIUM]

  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={80} minHeight={40}>
      <Wrapper>
        <Container>
          <AutoColumn>
            <CurrencyLogo currency={currency} size="48px" />
          </AutoColumn>
          <ShortColumn>
            <TokenWarningLabel warningType={WarningTypes.MEDIUM}></TokenWarningLabel>
          </ShortColumn>
          <ShortColumn>
            <InfoText fontSize="20px">{heading}</InfoText>
          </ShortColumn>
          <ShortColumn>
            <InfoText>
              {description} <b>Learn More</b>
            </InfoText>
          </ShortColumn>
          <LinkColumn>
            <EtherscanLink href={'https://etherscan.io/token/' + tokenAddress}>
              {'https://etherscan.io/token/' + tokenAddress}
            </EtherscanLink>
            <ExternalLinkIcon href={'https://etherscan.io/token/' + tokenAddress} />
          </LinkColumn>
          {onProceed ? (
            <>
              <StyledProceedButton onClick={onProceed}>I Understand</StyledProceedButton>
              <StyledCancelButton onClick={onCancel}>Cancel</StyledCancelButton>
            </>
          ) : (
            <StyledCloseButton onClick={onCancel}>Close</StyledCloseButton>
          )}
        </Container>
      </Wrapper>
    </Modal>
  )
}

import { Trans } from '@lingui/macro'
import { ExternalLink } from 'react-feather'
import styled from 'styled-components/macro'

import { TYPE } from '../../theme'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
`

const TitleWrapper = styled.div`
  margin: 2rem 0;
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1rem;
`

const StyledLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  color: #fff;

  &:hover {
    color: ${({ theme }) => theme.primary1};
  }
`

const FAQ = () => {
  return (
    <Container>
      <TitleWrapper>
        <TYPE.largeHeader>
          <Trans>Frequently Asked Questions</Trans>
        </TYPE.largeHeader>
      </TitleWrapper>
      <ContentWrapper>
        <StyledLink href="https://docs.kromatika.finance/kromatika-dapp-2.0/tutorials/how-to-use-felo" target="_blank">
          <TYPE.subHeader>
            <Trans>How to use FELO</Trans>
          </TYPE.subHeader>
          <ExternalLink size={18} />
        </StyledLink>
        <StyledLink href="https://docs.kromatika.finance/kromatika-dapp-2.0/tutorials/how-to-use-swap" target="_blank">
          <TYPE.subHeader>
            <Trans>How to use Swap</Trans>
          </TYPE.subHeader>
          <ExternalLink size={18} />
        </StyledLink>
        <StyledLink
          href="https://docs.kromatika.finance/kromatika-dapp-2.0/tutorials/how-to-use-gasless"
          target="_blank"
        >
          <TYPE.subHeader>
            <Trans>How to use Gasless</Trans>
          </TYPE.subHeader>
          <ExternalLink size={18} />
        </StyledLink>
        <StyledLink
          href="https://docs.kromatika.finance/kromatika-dapp-2.0/tutorials/how-to-use-perpetuals"
          target="_blank"
        >
          <TYPE.subHeader>
            <Trans>How to use Perpetuals</Trans>
          </TYPE.subHeader>
          <ExternalLink size={18} />
        </StyledLink>
      </ContentWrapper>
    </Container>
  )
}

export default FAQ

import { Trans } from '@lingui/macro'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import styled from 'styled-components/macro'
import { ExternalLink, HideSmall, ThemedText } from 'theme'

import { AutoRow } from '../Row'

const ContentWrapper = styled.div`
  border-radius: 20px;
  padding: 24px 16px;
  display: flex;
  flex-direction: row;
  position: relative;
  width: 100%;
  background: radial-gradient(100% 93.36% at 0% 6.64%, rgba(255, 213, 0, 0) 0%, rgba(0, 91, 187, 0.3) 100%), #002c5a;
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 18px;
  margin: 0;
`

const LinkOut = styled(ExternalLink)`
  align-items: center;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  justify-content: space-between;
  text-decoration: none !important;
  width: 100%;
`

export const StyledFlagImage = styled.div`
  margin-right: 12px;
  width: 18px;
  height: 18px;
  border-radius: 100%;

  &:before,
  &:after {
    content: '';
    width: 9px;
    height: 18px;
  }

  &:before {
    float: left;
    border-top-left-radius: 9px;
    border-bottom-left-radius: 9px;
    background: #005bbb;
  }

  &:after {
    float: right;
    border-top-right-radius: 9px;
    border-bottom-right-radius: 9px;
    background: #ffd500;
  }

  transform: rotate(90deg);
`

const StyledButton = styled(ButtonLight)`
  padding: 8px;
  border-radius: 12px;
  width: 140px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.15);
  color: ${({ theme }) => theme.text1};
`

export default function DonationHeader() {
  return (
    <ContentWrapper>
      <LinkOut href={''}>
        <AutoColumn gap="sm">
          <AutoRow align="center">
            <StyledFlagImage />
            <Header>
              <Trans>Dontate ETH to Ukraine</Trans>
            </Header>
          </AutoRow>
          <HideSmall>
            <ThemedText.SubHeader fontSize="12px" fontWeight={400} maxWidth="280px">
              <Trans>Select which token you want to donate below.</Trans>
            </ThemedText.SubHeader>
          </HideSmall>
        </AutoColumn>
        <StyledButton>Learn More</StyledButton>
      </LinkOut>
    </ContentWrapper>
  )
}

import React from 'react'
import { useFoundOnInactiveList } from 'state/lists/hooks'
import { Token } from '@uniswap/sdk'
import styled from 'styled-components'
import { TYPE } from 'theme'
import Card, { GreyCard, OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { ButtonPrimary } from 'components/Button'
import TLLogo from '../../assets/images/token-list-logo.png'
import { ExternalLink } from 'react-feather'

const Wrapper = styled.div`
  height: 100%;
  position: relative;
  border-radius: 20px;
  padding: 1rem;
`

const Footer = styled.div`
  position: absolute;
  bottom: 1rem;
  width: calc(100% - 2rem);
  border-radius: 20px;
`

const BottomWrapper = styled(GreyCard)`
  border-radius: 20px;
  padding: 0;
`

const TokenSection = styled(OutlineCard)`
  border-radius: 20px;
  padding: 1rem;
  border: 2px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme }) => theme.bg1};
`

const WrappedLogo = styled.img`
  height: 20px;
`

const LinkIcon = styled(ExternalLink)`
  height: 16px;
  width: 18px;
  margin-left: 10px;
  stroke: ${({ theme }) => theme.blue1};
`

export function EmptyState({ searchQuery }: { searchQuery: string }) {
  const inactiveToken: Token | undefined = useFoundOnInactiveList(searchQuery)

  return (
    <Wrapper>
      <Card>
        <TYPE.main textAlign="center">No result found on active lists.</TYPE.main>
      </Card>
      {inactiveToken && (
        <Footer>
          <BottomWrapper>
            <AutoColumn>
              <RowBetween padding="1rem">
                <WrappedLogo src={TLLogo} alt="token lists" />
                <TYPE.body fontWeight={500}>1 result</TYPE.body>
              </RowBetween>
              <TokenSection>
                <RowBetween>
                  <AutoColumn gap="sm">
                    <RowFixed>
                      <CurrencyLogo currency={inactiveToken} size={'24px'} />
                      <TYPE.body ml="10px" fontWeight={500}>
                        {inactiveToken?.symbol}
                      </TYPE.body>
                      <LinkIcon />
                    </RowFixed>
                  </AutoColumn>
                  <ButtonPrimary width="fit-content" padding="8px 10px">
                    Add
                  </ButtonPrimary>
                </RowBetween>
              </TokenSection>
            </AutoColumn>
          </BottomWrapper>
        </Footer>
      )}
    </Wrapper>
  )
}

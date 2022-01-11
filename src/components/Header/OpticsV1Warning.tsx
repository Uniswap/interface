import { useContractKit } from '@celo-tools/use-contractkit'
import { JSBI, Token } from '@ubeswap/sdk'
import { AutoColumn, TopSection } from 'components/Column'
import { CardSection } from 'components/earn/styled'
import { RowBetween, RowStart } from 'components/Row'
import { filterTokens } from 'components/SearchModal/filtering'
import { useAllTokens } from 'hooks/Tokens'
import React, { useContext, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { useTokenBalances } from 'state/wallet/hooks'
import styled, { ThemeContext } from 'styled-components'
import { ExternalLink, TYPE } from 'theme'

const WarningCard = styled(AutoColumn)<{ disabled?: boolean }>`
  background-color: ${(props) => props.theme.bg1};
  border-top: 3px solid ${(props) => props.theme.primary1};
  width: 100%;
  position: relative;
  overflow: hidden;
`

export default function OpticsV1Warning() {
  const { address: account, network } = useContractKit()
  const theme = useContext(ThemeContext)
  const chainId = network.chainId
  const allTokens = useAllTokens(chainId)
  const opticsv1Tokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), 'Optics v1')
  }, [allTokens])

  const opticsV1Balance = useTokenBalances(account ?? undefined, opticsv1Tokens)
  const opticsV1TokensWithBalances =
    Object.values(opticsV1Balance).length > 0 &&
    Object.values(opticsV1Balance)
      .filter((balance) => balance?.numerator && JSBI.greaterThan(balance.numerator, JSBI.BigInt(0)))
      .map((balance) => <span key={balance?.currency.address}>{balance?.currency.symbol} </span>)

  return (
    <TopSection gap="md">
      {opticsV1TokensWithBalances && opticsV1TokensWithBalances.length > 0 && (
        <WarningCard>
          <CardSection>
            <RowStart>
              <div style={{ paddingRight: 16 }}>
                <AlertTriangle color={theme.yellow2} size={36} />
              </div>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.black fontWeight={600}>
                    You have the following Optics V1 Tokens: {opticsV1TokensWithBalances}
                  </TYPE.black>
                </RowBetween>
                <RowBetween>
                  <TYPE.black fontSize={14}>
                    Please either migrate your tokens to Optics v2 tokens or bridge your tokens
                  </TYPE.black>
                </RowBetween>
                <RowStart>
                  <ExternalLink href="https://www.mobius.money/#/opensum">Migrate</ExternalLink>
                  &nbsp;
                  <ExternalLink href="https://old.optics.app/">Bridge</ExternalLink>
                </RowStart>
              </AutoColumn>
            </RowStart>
          </CardSection>
        </WarningCard>
      )}
    </TopSection>
  )
}

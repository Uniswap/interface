import 'styled-components/macro'
import React from 'react'
import { Pair } from 'v2-sdk/entities'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Link } from 'react-router-dom'
import { CurrencyAmount, Token } from 'sdk-core/entities'
import { BIG_INT_SECONDS_IN_WEEK } from 'constants/misc'
import { CurrencyLogoFromList } from 'components/CurrencyLogo/CurrencyLogoFromList'
import JSBI from 'jsbi'
import { DefaultTheme } from 'styled-components/macro'
import styled from 'styled-components'
import { HRDark } from '../HR/HR'
import Column, { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const FarmContainer = styled(Column)`
  max-width: 1080px;
  width: 100%;
  //background: ${({ theme }: { theme: DefaultTheme }) => theme.secondary1_30};
  //box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
  //  0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 10px;
  padding: 24px;
  //border: 1px solid blue;
  flex: 1 1;
  position: relative;

  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent} 0%, ${theme.secondary1_30} 35%, ${theme.darkTransparent} 100%);`};
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.3);
  border-radius: 8px;
`

export function FarmTable({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <FarmContainer>
        {/*<div*/}
        {/*  css={`*/}
        {/*    display: grid;*/}
        {/*    gap: 8px;*/}
        {/*    grid-template-columns: repeat(4, minmax(0, 1fr));*/}
        {/*  `}*/}
        {/*>*/}
        <FarmTableHeader />
        {/*<RowBetween>*/}
        {/*  <HR />*/}
        {/*</RowBetween>*/}
        {children}
        {/*</div>*/}
      </FarmContainer>
    </>
  )
}

// const FarmTableHeaderRow = styled(RowBetween)`
//
// `

const FarmTableHeaderText = styled(AutoColumn)`
  font-size: 1rem;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.primary1};
  text-align: center;
`

const FarmTableHeaderContainer = styled(AutoRow)`
  //background: ${({ theme }: { theme: DefaultTheme }) => theme.secondary1_30};
  //box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
  //  0px 24px 32px rgba(0, 0, 0, 0.01);
  //border-radius: 8px 8px 0px 0px;
  //padding: 10px 25px;
  padding-left: 11%;
  padding-right: 5%;
  margin-bottom: 2%;
`

export function FarmTableHeader() {
  return (
    <FarmTableHeaderContainer justify={'space-between'}>
      <FarmTableHeaderText>Pool</FarmTableHeaderText>
      <FarmTableHeaderText>TVL</FarmTableHeaderText>
      <FarmTableHeaderText>Rewards (per Week)</FarmTableHeaderText>
      <FarmTableHeaderText>APR</FarmTableHeaderText>
    </FarmTableHeaderContainer>
  )
}

type TableRowProps = {
  poolId: number
  pair?: Pair
  tvl?: CurrencyAmount<Token>
  totalLPStaked?: CurrencyAmount<Token>
  primaryEmissionPerSecond?: CurrencyAmount<Token>
  secondaryEmissionPerSecond?: CurrencyAmount<Token>
  totalAPR?: JSBI
}

const PoolPair = styled(AutoColumn)`
  display: flex;
  justify-content: start;
  align-items: center;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.primary1};
  width: 25%;
`

const TVL = styled(AutoColumn)`
  justify-content: end;
  text-align: right;
  text-decoration: none;
  padding-right: 24px;
  width: 25%;
`

const PoolRow = styled(Link)`
  text-decoration: none;
  border-radius: 10px;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.text1};
  font-size: 1.1rem;
  //border: 1px solid rgba(12, 92, 146, 0.2);
  //box-shadow: 0 0 5px rgba(39, 210, 234, 0.05), 0 0 7px rgba(39, 210, 234, 0.05);
  :hover,
  :focus {
    color: ${({ theme }) => theme.text2};
    border: 1px solid rgba(12, 92, 146, 0.7);
    box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.1);
    background: linear-gradient(
      264deg,
      rgba(16, 16, 18, 0.1) 0%,
      rgba(39, 210, 234, 0.05) 25%,
      rgba(16, 16, 18, 0.1) 50%,
      rgba(39, 210, 234, 0.05) 75%,
      rgba(16, 16, 18, 0.1) 100%
    );
  }
  padding: 10px 30px;
  margin-top: 2%;
`

const Emission = styled(AutoColumn)`
  display: flex;
  justify-content: end;
  align-items: center;
  padding-top: 8px;
`

const EmissionText = styled.span`
  padding-right: 10px;
`

const RowColumn = styled.div`
  width: 25%;
  text-align: right;
  justify-content: flex-end;
`

export function FarmTableRow({
  pair,
  poolId,
  tvl,
  totalLPStaked,
  primaryEmissionPerSecond,
  secondaryEmissionPerSecond,
  totalAPR,
}: TableRowProps) {
  return (
    <PoolRow to={`/farm/${poolId}`}>
      <AutoRow gap="0%" justify={'space-between'}>
        <PoolPair>
          <DoubleCurrencyLogo currency0={pair?.token1} currency1={pair?.token0} size={36} />
          <span
            css={`
              margin-left: 10px;
            `}
          >
            {pair?.token0.symbol}/{pair?.token1.symbol}
          </span>
        </PoolPair>
        <TVL>
          {tvl
            ? `$${tvl.toFixed(0, { groupSeparator: ',' })}`
            : `${totalLPStaked?.toSignificant(4, { groupSeparator: ',' }) ?? '-'} DIFF-LP`}
        </TVL>
        <RowColumn>
          <Emission>
            <EmissionText>
              {primaryEmissionPerSecond?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ?? '-'}
            </EmissionText>
            <CurrencyLogoFromList
              currency={primaryEmissionPerSecond?.currency}
              title={secondaryEmissionPerSecond?.currency.symbol}
            />
          </Emission>
          {secondaryEmissionPerSecond && (
            <Emission>
              <EmissionText>
                {secondaryEmissionPerSecond?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ??
                  '-'}
              </EmissionText>
              <CurrencyLogoFromList
                currency={secondaryEmissionPerSecond?.currency}
                title={secondaryEmissionPerSecond?.currency.symbol}
              />
            </Emission>
          )}
        </RowColumn>
        <RowColumn>
          {totalAPR && JSBI.GT(totalAPR, JSBI.BigInt(0)) ? `${JSBI.multiply(totalAPR, JSBI.BigInt(100))}%` : '-'}
        </RowColumn>
      </AutoRow>
      <HRDark />
    </PoolRow>
  )
}

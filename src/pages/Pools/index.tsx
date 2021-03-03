import React, { useContext, useCallback, useMemo } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import styled, { ThemeContext } from 'styled-components'
import { darken } from 'polished'

import { ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useDerivedPairInfo, usePairActionHandlers, usePairState } from 'state/pair/hooks'
import { Field } from 'state/pair/actions'
import { Currency } from 'libs/sdk/src'
import { useTrackedTokenPairs, useToV2LiquidityTokens } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'

const PageWrapper = styled(AutoColumn)`
  display: flex;
  padding: 0 10em;
  width: 100%;
`
const LeftColumn = styled(AutoColumn)`
  width: 10em;
`
const RightColumn = styled(AutoColumn)`
  width: 100%;
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg1 : theme.primary1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 12px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;

  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.primary1))};
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`
const Pools = ({ match: {} }: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const theme = useContext(ThemeContext)
  const { account, chainId, library } = useActiveWeb3React()

  // Pool selection--------------------------------------------------------------------
  const { onCurrencySelection } = usePairActionHandlers()
  const {
    [Field.CURRENCY_A]: { currencyId: currencyIdA },
    [Field.CURRENCY_B]: { currencyId: currencyIdB }
  } = usePairState()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      onCurrencySelection(Field.CURRENCY_A, currencyA)
    },
    [onCurrencySelection]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      onCurrencySelection(Field.CURRENCY_B, currencyB)
    },
    [onCurrencySelection]
  )

  // Your Liquidity--------------------------------------------------------------------
  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(trackedTokenPairs)
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens), [
    tokenPairsWithLiquidityTokens
  ]).flatMap(x => x)
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  const liquidityTokensWithBalances = tokenPairsWithLiquidityTokens

  const poolList = pairs.map(([pairState, pair]) => pair)

  return (
    <>
      <PageWrapper>
        <LeftColumn>
          <CurrencyInputPanel
            value={''}
            onUserInput={() => {}}
            onMax={() => {}}
            onCurrencySelect={handleCurrencyASelect}
            showMaxButton={false}
            currency={currencies[Field.CURRENCY_A]}
            id="input-tokena"
            hideInput={true}
            hideBalance={true}
          />
          <CurrencyInputPanel
            value={''}
            onUserInput={() => {}}
            onMax={() => {}}
            onCurrencySelect={handleCurrencyBSelect}
            showMaxButton={false}
            currency={currencies[Field.CURRENCY_B]}
            id="input-tokenb"
            hideInput={true}
            hideBalance={true}
          />
        </LeftColumn>
        <RightColumn>
          <div style={{ marginBottom: '18px' }}>
            <Link
              to={`/create/${currencyIdA == '' ? undefined : currencyIdA}/${
                currencyIdB == '' ? undefined : currencyIdB
              }`}
            >
              <ButtonOutlined variant="outline" width="148px" padding="12px 18px" style={{ float: 'right' }}>
                + Create New Pool
              </ButtonOutlined>
            </Link>
          </div>
          <Panel>{poolList.length > 0 && <PoolList pairs={poolList} />}</Panel>
        </RightColumn>
      </PageWrapper>
    </>
  )
}

export default Pools

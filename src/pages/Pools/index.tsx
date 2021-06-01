import React, { useState, useCallback, useMemo } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'
import { useTranslation } from 'react-i18next'
import { useMedia } from 'react-use'

import { Currency } from 'libs/sdk/src'
import { ButtonOutlined } from 'components/Button'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import Search from 'components/Search'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useETHPrice } from 'state/application/hooks'
import { useDerivedPairInfo, usePairActionHandlers } from 'state/pair/hooks'
import { useUserLiquidityPositions, useBulkPoolData, useResetPools } from 'state/pools/hooks'
import { Field } from 'state/pair/actions'
import { currencyId } from 'utils/currencyId'

const PageWrapper = styled.div`
  padding: 0 17em;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 0 12rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 4em;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `};
`

const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 8px;
    flex-direction: column;
  `};
`

const SearchWrapper = styled(Flex)`
  align-items: center;
`

const SelectPairInstructionWrapper = styled.div`
  text-align: center;
  height: 100%;
  padding: 24px;
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.red1};
  font-style: italic;
  font-weight: 400;
  text-align: center;
  margin-top: 1rem;
`

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')

  const above1400 = useMedia('(min-width: 1400px)')

  // Pool selection
  const { onCurrencySelection } = usePairActionHandlers()
  // const {
  //   [Field.CURRENCY_A]: { currencyId: currencyIdA },
  //   [Field.CURRENCY_B]: { currencyId: currencyIdB }
  // } = usePairState()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const ethPrice = useETHPrice()

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/pools/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/pools/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/pools/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const poolsList = useMemo(
    () =>
      pairs
        .map(([pairState, pair]) => pair)
        .filter(pair => pair !== null)
        .filter(pair => {
          if (searchValue) {
            return pair?.address.toLowerCase().includes(searchValue.toLowerCase())
          }

          return true
        }),
    [pairs, searchValue]
  )

  // format as array of addresses
  const formattedPools = useMemo(() => poolsList.map(pool => pool?.address.toLowerCase()), [poolsList])

  useResetPools(currencyA ?? undefined, currencyB ?? undefined)

  // get data for every pool in list
  const { loading: loadingPoolsData, error: errorPoolsData, data: poolsData } = useBulkPoolData(
    formattedPools,
    ethPrice.currentPrice
  )

  // const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)
  const temp = useUserLiquidityPositions(account)
  const loadingUserLiquidityPositions = !account ? false : temp.loading
  const userLiquidityPositions = !account ? { liquidityPositions: [] } : temp.data

  return (
    <>
      <PageWrapper>
        {above1400 ? (
          <>
            <div style={{ marginBottom: '16px' }}>{t('selectPair')}</div>
            <ToolbarWrapper>
              <CurrencyWrapper>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyASelect}
                  currency={currencies[Field.CURRENCY_A]}
                  otherCurrency={currencies[Field.CURRENCY_B]}
                  id="input-tokena"
                />
                <span style={{ margin: '0 8px' }}>/</span>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyBSelect}
                  currency={currencies[Field.CURRENCY_B]}
                  otherCurrency={currencies[Field.CURRENCY_A]}
                  id="input-tokenb"
                />
              </CurrencyWrapper>
              <SearchWrapper>
                <Search searchValue={searchValue} setSearchValue={setSearchValue} />
                <ButtonOutlined
                  width="148px"
                  padding="12px 18px"
                  as={Link}
                  to={`/create/${currencyIdA == '' ? undefined : currencyIdA}/${
                    currencyIdB == '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right' }}
                >
                  {t('createNewPool')}
                </ButtonOutlined>
              </SearchWrapper>
            </ToolbarWrapper>
          </>
        ) : (
          <>
            <ToolbarWrapper>
              <div>{t('selectPair')}</div>
              <SearchWrapper>
                <ButtonOutlined
                  width="98px"
                  padding="10px 12px"
                  as={Link}
                  to={`/create/${currencyIdA == '' ? undefined : currencyIdA}/${
                    currencyIdB == '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right' }}
                >
                  {t('newPool')}
                </ButtonOutlined>
              </SearchWrapper>
            </ToolbarWrapper>
            <CurrencyWrapper>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyASelect}
                currency={currencies[Field.CURRENCY_A]}
                otherCurrency={currencies[Field.CURRENCY_B]}
                id="input-tokena"
              />
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyBSelect}
                currency={currencies[Field.CURRENCY_B]}
                otherCurrency={currencies[Field.CURRENCY_A]}
                id="input-tokenb"
              />
            </CurrencyWrapper>
          </>
        )}

        <Panel>
          {loadingUserLiquidityPositions || loadingPoolsData ? (
            <LocalLoader />
          ) : poolsList.length > 0 && poolsData.length > 0 && userLiquidityPositions?.liquidityPositions ? (
            <PoolList
              poolsList={poolsList}
              subgraphPoolsData={poolsData}
              userLiquidityPositions={userLiquidityPositions.liquidityPositions}
              maxItems={3}
            />
          ) : (
            <SelectPairInstructionWrapper>
              <div style={{ marginBottom: '1rem' }}>{t('thereAreNoPools')}</div>
              <div>{t('thereAreNoPoolsInstruction')}</div>
            </SelectPairInstructionWrapper>
          )}
        </Panel>

        {errorPoolsData ? <ErrorMessage>{t('somethingWentWrong')}</ErrorMessage> : null}
      </PageWrapper>
    </>
  )
}

export default Pools

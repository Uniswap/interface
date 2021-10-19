import React, { useState, useCallback, useMemo } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'

import { ChainId, Currency } from '@dynamic-amm/sdk'
import { POPULAR_PAIRS } from 'constants/index'
import { ButtonGray, ButtonOutlined, ButtonPrimary } from 'components/Button'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import Search from 'components/Search'
import LocalLoader from 'components/LocalLoader'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useETHPrice } from 'state/application/hooks'
import { useDerivedPairInfo } from 'state/pair/hooks'
import { useUserLiquidityPositions, useBulkPoolData, useResetPools } from 'state/pools/hooks'
import { Field } from 'state/pair/actions'
import { currencyId, currencyIdFromAddress } from 'utils/currencyId'
import { useGlobalData } from 'state/about/hooks'
import {
  PageWrapper,
  GlobalDataContainer,
  GlobalDataItem,
  GlobalDataItemTitle,
  GlobalDataItemValue,
  AddLiquidityInstructionContainer,
  AddLiquidityTitle,
  AddLiquidityInstructionText,
  ToolbarWrapper,
  CurrencyWrapper,
  SearchWrapper,
  SelectPairInstructionWrapper
} from './styleds'
import { formatBigLiquidity } from 'utils/formatBalance'
import Loader from 'components/Loader'
import { Farm } from 'state/farms/types'
import { useFarmsData } from 'state/farms/hooks'
import { PopularPair } from 'state/pair/types'

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const { account, chainId } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')
  const above1000 = useMedia('(min-width: 1000px)')

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const ethPrice = useETHPrice()

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
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
    [currencyIdA, history, currencyIdB, chainId]
  )

  const poolsList = useMemo(
    () =>
      pairs
        .map(([_, pair]) => pair)
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
  const { loading: loadingPoolsData, data: poolsData } = useBulkPoolData(formattedPools, ethPrice.currentPrice)

  // const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)
  const temp = useUserLiquidityPositions(account)
  const loadingUserLiquidityPositions = !account ? false : temp.loading
  const userLiquidityPositions = !account ? { liquidityPositions: [] } : temp.data

  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]

  const { loading: loadingPoolFarm, data: farms } = useFarmsData()

  const popularPairs: PopularPair[] = POPULAR_PAIRS[chainId as ChainId]

  return (
    <>
      <PageWrapper>
        <GlobalDataContainer>
          <GlobalDataItem>
            <GlobalDataItemTitle>
              <Trans>Total Trading Volume:</Trans>
            </GlobalDataItemTitle>
            <GlobalDataItemValue>
              {globalData ? formatBigLiquidity(globalData.totalVolumeUSD, 2, true) : <Loader />}
            </GlobalDataItemValue>
          </GlobalDataItem>
          <GlobalDataItem>
            <GlobalDataItemTitle>
              <Trans>Total Value Locked:</Trans>
            </GlobalDataItemTitle>
            <GlobalDataItemValue>
              {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
            </GlobalDataItemValue>
          </GlobalDataItem>
          <GlobalDataItem>
            <GlobalDataItemTitle>
              <Trans>Total AMP Liquidity:</Trans>
            </GlobalDataItemTitle>
            <GlobalDataItemValue>
              {globalData ? formatBigLiquidity(globalData.totalAmplifiedLiquidityUSD, 2, true) : <Loader />}
            </GlobalDataItemValue>
          </GlobalDataItem>
        </GlobalDataContainer>

        <AddLiquidityInstructionContainer>
          <AddLiquidityTitle>
            <Trans>Add liquidity:</Trans>
          </AddLiquidityTitle>
          <AddLiquidityInstructionText>
            <Trans>
              Receive liquidity pool tokens representing your position and earn fees proportional to your pool share.
              Fees are automatically claimed when you withdraw your liquidity.
            </Trans>
          </AddLiquidityInstructionText>
        </AddLiquidityInstructionContainer>

        {above1000 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Trans>Select Pair</Trans>
            </div>
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

                {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && (
                  <ButtonPrimary
                    padding="8px 28px"
                    as={Link}
                    to={`/swap?inputCurrency=${currencyId(
                      currencies[Field.CURRENCY_A] as Currency,
                      chainId
                    )}&outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`}
                    width="fit-content"
                    style={{ marginLeft: '1rem', borderRadius: '8px' }}
                  >
                    <span>
                      <Trans>Trade</Trans>
                    </span>
                  </ButtonPrimary>
                )}
              </CurrencyWrapper>

              <SearchWrapper>
                <Search searchValue={searchValue} setSearchValue={setSearchValue} />
                <ButtonOutlined
                  width="148px"
                  padding="12px 18px"
                  as={Link}
                  to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                    currencyIdB === '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right' }}
                >
                  <Trans>+ Create New Pool</Trans>
                </ButtonOutlined>
              </SearchWrapper>
            </ToolbarWrapper>
          </>
        ) : (
          <>
            <ToolbarWrapper>
              <Trans>Select Pair</Trans>
              <SearchWrapper>
                <ButtonOutlined
                  padding="10px 12px"
                  as={Link}
                  to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                    currencyIdB === '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right' }}
                >
                  <Trans>+ Create New Pool</Trans>
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
              {above1000 && <span style={{ margin: '0 8px' }}>/</span>}
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
          ) : poolsList.length > 0 ? (
            <PoolList
              poolsList={poolsList}
              subgraphPoolsData={poolsData}
              userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
              maxItems={2}
            />
          ) : (
            <SelectPairInstructionWrapper>
              <div style={{ marginBottom: '1rem' }}>
                <Trans>There are no pools for this token pair.</Trans>
              </div>
              <div>
                <Trans>Create a new pool or select another pair of tokens to view the available pools.</Trans>
              </div>
            </SelectPairInstructionWrapper>
          )}
        </Panel>

        <div style={{ marginTop: '16px' }}>
          <Trans>Popular Pairs</Trans> &nbsp;
          {loadingPoolFarm && <Loader />}
        </div>
        <Flex alignItems="center" justifyContent="flexStart" flexWrap="wrap">
          {Object.values(farms)
            .flat()
            .map((farm, index) => (
              <PoolFarm key={index} farm={farm} />
            ))}
          {popularPairs.map((pair, index) => (
            <PoolFarm key={index} farm={pair} />
          ))}
        </Flex>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

const PoolFarm = ({ farm }: { farm: Farm | PopularPair }) => {
  const { chainId } = useActiveWeb3React()
  return (
    <ButtonGray
      padding="8px 28px"
      as={Link}
      to={`/pools/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
        farm.token1?.id,
        chainId
      )}`}
      width="fit-content"
      style={{ margin: '1rem 1rem 0 0', borderRadius: '8px' }}
    >
      <span>
        <Trans>
          {farm.token0?.symbol}-{farm.token1?.symbol}
        </Trans>
      </span>
    </ButtonGray>
  )
}

export default Pools

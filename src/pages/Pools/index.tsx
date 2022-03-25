import React, { useCallback, useMemo, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { Currency } from '@dynamic-amm/sdk'
import { ButtonPrimary } from 'components/Button'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import Search from 'components/Search'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { Field } from 'state/pair/actions'
import { currencyId } from 'utils/currencyId'
import { CurrencyWrapper, SearchWrapper, ToolbarWrapper, PoolsPageWrapper } from './styleds'
import InstructionAndGlobalData from 'pages/Pools/InstructionAndGlobalData'
import FarmingPoolsMarquee from 'pages/Pools/FarmingPoolsMarquee'
import useTheme from 'hooks/useTheme'
import FilterBarToggle from 'components/Toggle/FilterBarToggle'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  location,
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const above1000 = useMedia('(min-width: 1000px)')
  const [isShowOnlyActiveFarmPools, setIsShowOnlyActiveFarmPools] = useState(false)
  const qs = useParsedQueryString()
  const searchValueInQs: string = (qs.search as string) ?? ''
  const debouncedSearchValue = useDebounce(searchValueInQs, 200)

  const onSearch = (search: string) => {
    history.replace(location.pathname + '?search=' + search)
  }

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  )

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${currencyIdA}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId],
  )
  const handleClearCurrencyA = useCallback(() => {
    history.push(`/pools/undefined/${currencyIdB}`)
  }, [currencyIdB, history])
  const handleClearCurrencyB = useCallback(() => {
    history.push(`/pools/${currencyIdA}/undefined`)
  }, [currencyIdA, history])
  const { mixpanelHandler } = useMixpanel()
  return (
    <>
      <PoolsPageWrapper>
        <InstructionAndGlobalData />

        {above1000 ? (
          <ToolbarWrapper>
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Provide Liquidity</Trans>
            </Text>
            <SearchWrapper>
              <ButtonPrimary
                padding="10px 12px"
                as={Link}
                to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                  currencyIdB === '' ? undefined : currencyIdB
                }`}
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_INITITATED)
                }}
                style={{ float: 'right', borderRadius: '4px', fontSize: '14px' }}
              >
                <Trans>+ Create New Pool</Trans>
              </ButtonPrimary>
            </SearchWrapper>
          </ToolbarWrapper>
        ) : (
          <ToolbarWrapper>
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Provide Liquidity</Trans>
            </Text>
            <SearchWrapper>
              <ButtonPrimary
                padding="10px 12px"
                as={Link}
                to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                  currencyIdB === '' ? undefined : currencyIdB
                }`}
                style={{ float: 'right', borderRadius: '4px', fontSize: '14px' }}
              >
                <Trans>+ Create Pool</Trans>
              </ButtonPrimary>
            </SearchWrapper>
          </ToolbarWrapper>
        )}

        <FarmingPoolsMarquee />

        {above1000 ? (
          <ToolbarWrapper>
            <CurrencyWrapper>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyASelect}
                onClearCurrency={handleClearCurrencyA}
                currency={currencies[Field.CURRENCY_A]}
                id="input-tokena"
              />
              <span style={{ margin: '0 8px' }}>-</span>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyBSelect}
                onClearCurrency={handleClearCurrencyB}
                currency={currencies[Field.CURRENCY_B]}
                id="input-tokenb"
              />
              <ButtonPrimary
                padding="9px 13px"
                width="fit-content"
                style={{ marginLeft: '16px', borderRadius: '4px', fontSize: '14px' }}
                onClick={() => {
                  if (currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?inputCurrency=${currencyId(
                        currencies[Field.CURRENCY_A] as Currency,
                        chainId,
                      )}&outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`,
                    )
                  } else if (currencies[Field.CURRENCY_A]) {
                    history.push(`/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}`)
                  } else if (currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`,
                    )
                  }
                }}
                disabled={!currencies[Field.CURRENCY_A] && !currencies[Field.CURRENCY_B]}
              >
                <Trans>Swap</Trans>
              </ButtonPrimary>
            </CurrencyWrapper>

            <Flex style={{ gap: '20px' }}>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <FilterBarToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <Trans>Farming Pools</Trans>
                </Text>
              </Flex>
              <Search
                searchValue={searchValueInQs}
                onSearch={onSearch}
                placeholder={t`Search by token name or pool address`}
              />
            </Flex>
          </ToolbarWrapper>
        ) : (
          <>
            <Search
              searchValue={searchValueInQs}
              onSearch={onSearch}
              placeholder={t`Search by token name or pool address`}
              style={{ marginBottom: '16px' }}
            />
            <Flex justifyContent="space-between" style={{ marginBottom: '16px' }}>
              <CurrencyWrapper>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyASelect}
                  onClearCurrency={handleClearCurrencyA}
                  currency={currencies[Field.CURRENCY_A]}
                  otherCurrency={currencies[Field.CURRENCY_B]}
                  id="input-tokena"
                />
                <span style={{ margin: '0 8px' }}>-</span>
                <PoolsCurrencyInputPanel
                  onCurrencySelect={handleCurrencyBSelect}
                  onClearCurrency={handleClearCurrencyB}
                  currency={currencies[Field.CURRENCY_B]}
                  otherCurrency={currencies[Field.CURRENCY_A]}
                  id="input-tokenb"
                />
              </CurrencyWrapper>
              <ButtonPrimary
                padding="9px 13px"
                width="fit-content"
                style={{ marginLeft: '8px', borderRadius: '4px', fontSize: '14px' }}
                onClick={() => {
                  if (currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?inputCurrency=${currencyId(
                        currencies[Field.CURRENCY_A] as Currency,
                        chainId,
                      )}&outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`,
                    )
                  } else if (currencies[Field.CURRENCY_A]) {
                    history.push(`/swap?inputCurrency=${currencyId(currencies[Field.CURRENCY_A] as Currency, chainId)}`)
                  } else if (currencies[Field.CURRENCY_B]) {
                    history.push(
                      `/swap?outputCurrency=${currencyId(currencies[Field.CURRENCY_B] as Currency, chainId)}`,
                    )
                  }
                }}
                disabled={!currencies[Field.CURRENCY_A] && !currencies[Field.CURRENCY_B]}
              >
                <Trans>Swap</Trans>
              </ButtonPrimary>
            </Flex>
            <Flex justifyContent="flex-end" style={{ marginBottom: '28px' }}>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <FilterBarToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <Trans>Farming Pools</Trans>
                </Text>
              </Flex>
            </Flex>
          </>
        )}

        <Panel>
          <PoolList
            currencies={currencies}
            searchValue={debouncedSearchValue}
            isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
          />
        </Panel>
      </PoolsPageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Pools

import React, { useCallback, useMemo, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { Currency, ChainId } from '@kyberswap/ks-sdk-core'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { PoolElasticIcon } from 'components/Icons'
import { PoolClassicIcon } from 'components/Icons'
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
import { GlobalData, Instruction } from 'pages/Pools/InstructionAndGlobalData'
import FarmingPoolsMarquee from 'pages/Pools/FarmingPoolsMarquee'
import useTheme from 'hooks/useTheme'
import FilterBarToggle from 'components/Toggle/FilterBarToggle'
import ProAmmPoolList from 'pages/ProAmmPools'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useDebounce from 'hooks/useDebounce'
import FarmingPoolsToggle from 'components/Toggle/FarmingPoolsToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { stringify } from 'qs'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { MouseoverTooltip } from 'components/Tooltip'

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
  const above1260 = useMedia('(min-width: 1260px)')
  const below1124 = useMedia('(max-width: 1124px)')
  const [isShowOnlyActiveFarmPools, setIsShowOnlyActiveFarmPools] = useState(false)
  const qs = useParsedQueryString()
  const searchValueInQs: string = (qs.search as string) ?? ''
  const debouncedSearchValue = useDebounce(searchValueInQs.trim().toLowerCase(), 200)

  const tab = (qs.tab as string) || VERSION.CLASSIC
  const onSearch = (search: string) => {
    history.replace(location.pathname + '?search=' + search + '&tab=' + tab)
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
        history.push(`/pools/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}?tab=${tab}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId, tab],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        history.push(`/pools/${currencyIdA}/${newCurrencyIdB}?tab=${tab}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId, tab],
  )
  const handleClearCurrencyA = useCallback(() => {
    history.push(`/pools/undefined/${currencyIdB}?tab=${tab}`)
  }, [currencyIdB, history, tab])
  const handleClearCurrencyB = useCallback(() => {
    history.push(`/pools/${currencyIdA}/undefined?tab=${tab}`)
  }, [currencyIdA, history, tab])

  const { mixpanelHandler } = useMixpanel()

  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId as ChainId]

  return (
    <>
      <PoolsPageWrapper>
        <GlobalData />

        <AutoColumn>
          <Flex>
            <MouseoverTooltip text={notSupportedMsg || ''}>
              <Flex
                alignItems={'center'}
                onClick={() => {
                  if (!!notSupportedMsg) return
                  const newQs = { ...qs, tab: VERSION.ELASTIC }
                  history.replace({ search: stringify(newQs) })
                }}
              >
                <Text
                  fontWeight={500}
                  fontSize={20}
                  color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
                  width={'auto'}
                  marginRight={'5px'}
                  role="button"
                  style={{
                    cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trans>Elastic Pools</Trans>
                </Text>
                <PoolElasticIcon size={16} color={tab === VERSION.ELASTIC ? theme.primary : theme.subText} />
              </Flex>
            </MouseoverTooltip>
            <Text
              fontWeight={500}
              fontSize={20}
              color={theme.subText}
              width={'auto'}
              marginRight={'18px'}
              marginLeft={'18px'}
            >
              |
            </Text>

            <Flex
              alignItems={'center'}
              onClick={() => {
                const newQs = { ...qs, tab: VERSION.CLASSIC }
                history.replace({ search: stringify(newQs) })
              }}
            >
              <Text
                fontWeight={500}
                fontSize={20}
                color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
                width={'auto'}
                marginRight={'5px'}
                style={{ cursor: 'pointer' }}
                role="button"
              >
                <Trans>Classic Pools</Trans>
              </Text>
              <PoolClassicIcon size={16} color={tab === VERSION.ELASTIC ? theme.subText : theme.primary} />
            </Flex>
          </Flex>
        </AutoColumn>

        <Instruction />

        <FarmingPoolsMarquee tab={tab} />

        {(tab === VERSION.ELASTIC ? (
          above1260
        ) : (
          above1000
        )) ? (
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
                style={{ marginLeft: '16px', borderRadius: '40px', fontSize: '14px' }}
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

            <Flex style={{ gap: '10px' }}>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <Text fontSize="14px" color={theme.subText}>
                  <Trans>Farming Pools</Trans>
                </Text>

                <FarmingPoolsToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
              </Flex>

              <Search
                searchValue={searchValueInQs}
                onSearch={onSearch}
                placeholder={t`Search by token name or pool address`}
                minWidth={below1124 ? '260px' : '360px'}
              />
              {tab === VERSION.ELASTIC && (
                <ToolbarWrapper style={{ marginBottom: '0px' }}>
                  <Text fontSize="20px" fontWeight={500}></Text>
                  <SearchWrapper>
                    <ButtonLight
                      padding="10px 12px"
                      as={Link}
                      onClick={() => {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_INITIATED)
                      }}
                      to={`/elastic/add${
                        currencyIdA && currencyIdB
                          ? `/${currencyIdA}/${currencyIdB}`
                          : currencyIdA || currencyIdB
                          ? `/${currencyIdA || currencyIdB}`
                          : ''
                      }`}
                      style={{ float: 'right', borderRadius: '40px', fontSize: '14px' }}
                    >
                      <Trans>+ Add Liquidity</Trans>
                    </ButtonLight>
                  </SearchWrapper>
                </ToolbarWrapper>
              )}
              <ToolbarWrapper style={{ marginBottom: '0px' }}>
                <Text fontSize="20px" fontWeight={500}></Text>
                <SearchWrapper>
                  <ButtonPrimary
                    padding="10px 12px"
                    as={Link}
                    onClick={() => {
                      if (tab === VERSION.CLASSIC) {
                        mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_INITITATED)
                      } else {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_CREATE_POOL_INITIATED)
                      }
                    }}
                    to={
                      tab === VERSION.CLASSIC
                        ? `/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                            currencyIdB === '' ? undefined : currencyIdB
                          }`
                        : `/elastic/add${
                            currencyIdA && currencyIdB
                              ? `/${currencyIdA}/${currencyIdB}`
                              : currencyIdA || currencyIdB
                              ? `/${currencyIdA || currencyIdB}`
                              : ''
                          }`
                    }
                    style={{ float: 'right', borderRadius: '40px', fontSize: '14px' }}
                  >
                    <Trans>Create Pool</Trans>
                  </ButtonPrimary>
                </SearchWrapper>
              </ToolbarWrapper>
            </Flex>
          </ToolbarWrapper>
        ) : (
          <>
            <Flex sx={{ gap: '12px' }}>
              <Search
                style={{ flex: 1 }}
                searchValue={searchValueInQs}
                onSearch={onSearch}
                placeholder={t`Search by token name or pool address`}
              />
              {tab === VERSION.CLASSIC && (
                <ButtonPrimary
                  padding="10px 12px"
                  width="106px"
                  as={Link}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_INITITATED)
                  }}
                  to={`/create/${currencyIdA === '' ? undefined : currencyIdA}/${
                    currencyIdB === '' ? undefined : currencyIdB
                  }`}
                  style={{ float: 'right', borderRadius: '40px', fontSize: '14px' }}
                >
                  <Trans>Create Pool</Trans>
                </ButtonPrimary>
              )}
            </Flex>
            <Flex justifyContent="space-between">
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
                style={{ marginLeft: '8px', borderRadius: '40px', fontSize: '14px' }}
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
            {tab === VERSION.ELASTIC && (
              <Flex justifyContent={'center'} style={{ gap: '23px' }}>
                <ToolbarWrapper style={{ marginBottom: '0px', width: '100%' }}>
                  <Text fontSize="20px" fontWeight={500}></Text>
                  <SearchWrapper width={'100%'}>
                    <ButtonLight
                      width={'100%'}
                      padding="10px 12px"
                      as={Link}
                      onClick={() => {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_INITIATED)
                      }}
                      to={`/elastic/add${
                        currencyIdA && currencyIdB
                          ? `/${currencyIdA}/${currencyIdB}`
                          : currencyIdA || currencyIdB
                          ? `/${currencyIdA || currencyIdB}`
                          : ''
                      }`}
                      style={{ float: 'right', borderRadius: '40px', fontSize: '14px' }}
                    >
                      <Trans>+ Add Liquidity</Trans>
                    </ButtonLight>
                  </SearchWrapper>
                </ToolbarWrapper>
                <ToolbarWrapper style={{ marginBottom: '0px', width: '100%' }}>
                  <Text fontSize="20px" fontWeight={500}></Text>
                  <SearchWrapper width={'100%'}>
                    <ButtonPrimary
                      padding="10px 12px"
                      width={'100%'}
                      as={Link}
                      onClick={() => {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_CREATE_POOL_INITIATED)
                      }}
                      to={`/elastic/add${
                        currencyIdA && currencyIdB
                          ? `/${currencyIdA}/${currencyIdB}`
                          : currencyIdA || currencyIdB
                          ? `/${currencyIdA || currencyIdB}`
                          : ''
                      }`}
                      style={{ float: 'right', borderRadius: '40px', fontSize: '14px' }}
                    >
                      <Trans>Create Pool</Trans>
                    </ButtonPrimary>
                  </SearchWrapper>
                </ToolbarWrapper>
              </Flex>
            )}
            <Flex justifyContent="flex-start">
              <Flex
                alignItems={'center'}
                style={above1260 ? { gap: '8px' } : { gap: '8px', width: '100%', justifyContent: 'space-between' }}
              >
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <Trans>Farming Pools</Trans>
                </Text>

                <FilterBarToggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
              </Flex>
            </Flex>
          </>
        )}

        <Panel>
          {tab === VERSION.CLASSIC ? (
            <PoolList
              currencies={currencies}
              searchValue={debouncedSearchValue}
              isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            />
          ) : (
            <ProAmmPoolList
              currencies={currencies}
              searchValue={debouncedSearchValue}
              isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            />
          )}
        </Panel>
      </PoolsPageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Pools

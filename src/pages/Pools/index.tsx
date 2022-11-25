import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'react-feather'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ReactComponent as StableIcon } from 'assets/svg/stable.svg'
import { ButtonPrimary } from 'components/Button'
import ClassicElasticTab from 'components/ClassicElasticTab'
import PoolList from 'components/PoolList'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Search from 'components/Search'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import FarmingPoolsMarquee from 'pages/Pools/FarmingPoolsMarquee'
import { GlobalData, Instruction } from 'pages/Pools/InstructionAndGlobalData'
import ProAmmPoolList from 'pages/ProAmmPools'
import { useToggleEthPowAckModal } from 'state/application/hooks'
import { Field } from 'state/pair/actions'
import { useUrlOnEthPowAck } from 'state/pools/hooks'
import { currencyId } from 'utils/currencyId'

import ModalEthPoWAck from './ModalEthPoWAck'
import { CurrencyWrapper, PoolsPageWrapper, ToolbarWrapper } from './styleds'

const highlight = (theme: DefaultTheme) => keyframes`
  0%{
    box-shadow: 0 0 0px 0px ${theme.primary};
  }
  100%{
    box-shadow: 0 0 8px 4px ${theme.primary};
  }
`

const ButtonPrimaryWithHighlight = styled(ButtonPrimary)`
  padding: 10px 12px;
  float: right;
  border-radius: 40px;
  font-size: 14px;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 0.8s 8 alternate ease-in-out;
  }
`

const TextWithTooltip = styled(Text)`
  position: relative;
  cursor: pointer;

  ::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2px);
    height: 0;
    border-bottom: ${({ theme }) => `1px dashed ${theme.subText}`};
  }
`

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  location,
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const theme = useTheme()
  const { chainId, isEVM, networkInfo } = useActiveWeb3React()
  const above1000 = useMedia('(min-width: 1000px)')
  const above1260 = useMedia('(min-width: 1260px)')
  const below1124 = useMedia('(max-width: 1124px)')
  const [isShowOnlyActiveFarmPools, setIsShowOnlyActiveFarmPools] = useState(false)
  const [shouldShowLowTVLPools, setShowLowTVLPools] = useState(false)
  const {
    search: searchValueInQs = '',
    tab = VERSION.ELASTIC,
    highlightCreateButton,
  } = useParsedQueryString<{
    search: string
    tab: string
    highlightCreateButton: string
  }>()
  const debouncedSearchValue = useDebounce(searchValueInQs.trim().toLowerCase(), 200)

  const [onlyShowStable, setOnlyShowStable] = useState(false)
  const shouldHighlightCreatePoolButton = highlightCreateButton === 'true'

  const [, setUrlOnEthPowAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()

  const onSearch = useCallback(
    (search: string) => {
      history.replace(location.pathname + '?search=' + search + '&tab=' + tab)
    },
    [tab, history, location.pathname],
  )

  useSyncNetworkParamWithStore()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  )

  const chainRoute = networkInfo.route
  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${chainRoute}/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        history.push(`/pools/${chainRoute}/${newCurrencyIdA}/${currencyIdB}?tab=${tab}`)
      }
    },
    [chainRoute, currencyIdB, history, currencyIdA, chainId, tab],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        history.push(`/pools/${chainRoute}/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        history.push(`/pools/${chainRoute}/${currencyIdA}/${newCurrencyIdB}?tab=${tab}`)
      }
    },
    [chainRoute, currencyIdA, history, currencyIdB, chainId, tab],
  )
  const handleClearCurrencyA = useCallback(() => {
    history.push(`/pools/${chainRoute}/undefined/${currencyIdB}?tab=${tab}`)
  }, [currencyIdB, history, tab, chainRoute])
  const handleClearCurrencyB = useCallback(() => {
    history.push(`/pools/${chainRoute}/${currencyIdA}/undefined?tab=${tab}`)
  }, [currencyIdA, history, tab, chainRoute])

  const { mixpanelHandler } = useMixpanel()

  const handleClickCreatePoolButton = () => {
    if (tab === VERSION.CLASSIC) {
      mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_INITITATED)
    } else {
      mixpanelHandler(MIXPANEL_TYPE.ELASTIC_CREATE_POOL_INITIATED)
    }

    const url =
      tab === VERSION.CLASSIC
        ? `/create/${currencyIdA === '' ? undefined : currencyIdA}/${currencyIdB === '' ? undefined : currencyIdB}`
        : `/elastic/add${
            currencyIdA && currencyIdB
              ? `/${currencyIdA}/${currencyIdB}`
              : currencyIdA || currencyIdB
              ? `/${currencyIdA || currencyIdB}`
              : ''
          }`

    if (chainId === ChainId.ETHW) {
      setUrlOnEthPowAck(url)
      toggleEthPowAckModal()
    } else {
      history.push(url)
    }
  }

  if (!isEVM) return <Redirect to="/" />
  return (
    <>
      <PoolsPageWrapper>
        <Flex justifyContent="space-between">
          <ClassicElasticTab />
          <GlobalData />
        </Flex>

        <Instruction />

        <Flex justifyContent="space-between" alignItems="center">
          <Flex sx={{ gap: '24px', cursor: 'pointer' }} alignItems="center">
            <Text
              role="button"
              color={onlyShowStable ? theme.subText : theme.primary}
              fontWeight="500"
              fontSize={[16, 20]}
              onClick={() => setOnlyShowStable(false)}
            >
              <Trans>All</Trans>
            </Text>

            <Flex
              role="button"
              alignItems="center"
              onClick={() => setOnlyShowStable(true)}
              color={!onlyShowStable ? theme.subText : theme.primary}
            >
              <StableIcon />
              <Text marginLeft="4px" fontWeight="500" fontSize={[16, 20]}>
                <Trans>Stablecoins</Trans>
              </Text>
            </Flex>
          </Flex>

          <Tutorial type={tab === VERSION.ELASTIC ? TutorialType.ELASTIC_POOLS : TutorialType.CLASSIC_POOLS} />
        </Flex>

        <FarmingPoolsMarquee tab={tab} />

        {(tab === VERSION.ELASTIC ? above1260 : above1000) ? (
          <ToolbarWrapper>
            <CurrencyWrapper>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyASelect}
                onClearCurrency={handleClearCurrencyA}
                currency={currencies[Field.CURRENCY_A]}
                id="input-tokena"
                showCommonBases
              />
              <span style={{ margin: '0 8px' }}>-</span>
              <PoolsCurrencyInputPanel
                onCurrencySelect={handleCurrencyBSelect}
                onClearCurrency={handleClearCurrencyB}
                currency={currencies[Field.CURRENCY_B]}
                id="input-tokenb"
                showCommonBases
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
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <MouseoverTooltip placement="top" width="fit-content" text={t`Total Value Locked is less than $1`}>
                    <TextWithTooltip>
                      <Trans>Low TVL Pools</Trans>
                    </TextWithTooltip>
                  </MouseoverTooltip>
                </Text>

                <Toggle isActive={shouldShowLowTVLPools} toggle={() => setShowLowTVLPools(prev => !prev)} />
              </Flex>

              <Flex alignItems="center" style={{ gap: '8px' }}>
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <Trans>Farming Pools</Trans>
                </Text>

                <Toggle
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

              <ToolbarWrapper style={{ marginBottom: '0px' }}>
                <ButtonPrimaryWithHighlight
                  onClick={handleClickCreatePoolButton}
                  data-highlight={shouldHighlightCreatePoolButton}
                  style={{
                    height: '38px',
                    padding: '0px 12px',
                  }}
                >
                  <Plus width="22" height="22" />
                  <Text as="span" sx={{ marginLeft: '4px' }}>
                    <Trans>Create Pool</Trans>
                  </Text>
                </ButtonPrimaryWithHighlight>
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
              {tab === VERSION.ELASTIC && (
                <ButtonPrimaryWithHighlight
                  onClick={handleClickCreatePoolButton}
                  data-highlight={shouldHighlightCreatePoolButton}
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: '0',
                  }}
                >
                  <Plus width="24px" height="24px" />
                </ButtonPrimaryWithHighlight>
              )}
              {tab === VERSION.CLASSIC && (
                <ButtonPrimaryWithHighlight
                  onClick={handleClickCreatePoolButton}
                  data-highlight={shouldHighlightCreatePoolButton}
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: '0',
                  }}
                >
                  <Plus width="24px" height="24px" />
                </ButtonPrimaryWithHighlight>
              )}
            </Flex>
            <Flex justifyContent="space-between">
              <CurrencyWrapper>
                <PoolsCurrencyInputPanel
                  showCommonBases
                  onCurrencySelect={handleCurrencyASelect}
                  onClearCurrency={handleClearCurrencyA}
                  currency={currencies[Field.CURRENCY_A]}
                  otherCurrency={currencies[Field.CURRENCY_B]}
                  id="input-tokena"
                />
                <span style={{ margin: '0 8px' }}>-</span>
                <PoolsCurrencyInputPanel
                  showCommonBases
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

            <Flex justifyContent="space-between" alignItems="center">
              <Flex
                alignItems={'center'}
                sx={{
                  columnGap: '8px',
                }}
              >
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <Trans>Farming Pools</Trans>
                </Text>

                <Toggle
                  isActive={isShowOnlyActiveFarmPools}
                  toggle={() => setIsShowOnlyActiveFarmPools(prev => !prev)}
                />
              </Flex>

              <Flex alignItems="center" style={{ gap: '8px' }}>
                <Text fontSize="14px" color={theme.subText} fontWeight={500}>
                  <MouseoverTooltip placement="top" width="fit-content" text={t`Total Value Locked is less than $1`}>
                    <TextWithTooltip>
                      <Trans>Low TVL Pools</Trans>
                    </TextWithTooltip>
                  </MouseoverTooltip>
                </Text>

                <Toggle isActive={shouldShowLowTVLPools} toggle={() => setShowLowTVLPools(prev => !prev)} />
              </Flex>
            </Flex>
          </>
        )}

        {tab === VERSION.CLASSIC ? (
          <PoolList
            currencies={currencies}
            searchValue={debouncedSearchValue}
            isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            onlyShowStable={onlyShowStable}
            shouldShowLowTVLPools={shouldShowLowTVLPools}
          />
        ) : (
          <ProAmmPoolList
            currencies={currencies}
            searchValue={debouncedSearchValue}
            isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            onlyShowStable={onlyShowStable}
            shouldShowLowTVLPools={shouldShowLowTVLPools}
          />
        )}
      </PoolsPageWrapper>
      <SwitchLocaleLink />

      <ModalEthPoWAck />
    </>
  )
}

export default Pools

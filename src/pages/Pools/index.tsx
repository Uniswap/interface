import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Plus, Share2 } from 'react-feather'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ReactComponent as StableIcon } from 'assets/svg/stable.svg'
import { ButtonPrimary } from 'components/Button'
import ClassicElasticTab from 'components/ClassicElasticTab'
import { MoneyBag } from 'components/Icons'
import PoolList from 'components/PoolList'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Search from 'components/Search'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Tutorial, { TutorialType } from 'components/Tutorial'
import FarmPoolSort from 'components/YieldPools/FarmPoolSort'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import { APP_PATHS } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import { Instruction } from 'pages/Pools/InstructionAndGlobalData'
import ProAmmPoolList from 'pages/ProAmmPools'
import { ApplicationModal } from 'state/application/actions'
import { useOpenModal, useToggleEthPowAckModal } from 'state/application/hooks'
import { Field } from 'state/pair/actions'
import { useUrlOnEthPowAck } from 'state/pools/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { currencyId } from 'utils/currencyId'

import ModalEthPoWAck from './ModalEthPoWAck'
import { CurrencyWrapper, PoolsPageWrapper, Tab } from './styleds'

const PoolSort = styled(FarmPoolSort)`
  height: 36px;
  min-width: 140px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: fit-content;
    padding: 10px;
  `};
`

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

const Pools = () => {
  const { currencyIdA, currencyIdB } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const theme = useTheme()

  const { chainId, isEVM, networkInfo } = useActiveWeb3React()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`) // 768
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`) // 576
  const upToXL = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXL}px)`) // 1400
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`) // 992

  const [isShowOnlyActiveFarmPools, setIsShowOnlyActiveFarmPools] = useState(false)
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

  const onSearch = (search: string) => {
    navigate(location.pathname + '?search=' + search + '&tab=' + tab, { replace: true })
  }

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
        navigate(`/pools/${chainRoute}/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        navigate(`/pools/${chainRoute}/${newCurrencyIdA}/${currencyIdB}?tab=${tab}`)
      }
    },
    [chainRoute, currencyIdB, navigate, currencyIdA, chainId, tab],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        navigate(`/pools/${chainRoute}/${currencyIdB}/${currencyIdA}?tab=${tab}`)
      } else {
        navigate(`/pools/${chainRoute}/${currencyIdA}/${newCurrencyIdB}?tab=${tab}`)
      }
    },
    [chainRoute, currencyIdA, navigate, currencyIdB, chainId, tab],
  )
  const handleClearCurrencyA = useCallback(() => {
    navigate(`/pools/${chainRoute}/undefined/${currencyIdB}?tab=${tab}`)
  }, [chainRoute, currencyIdB, navigate, tab])
  const handleClearCurrencyB = useCallback(() => {
    navigate(`/pools/${chainRoute}/${currencyIdA}/undefined?tab=${tab}`)
  }, [chainRoute, currencyIdA, navigate, tab])

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
        : `${APP_PATHS.ELASTIC_CREATE_POOL}${
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
      navigate(url)
    }
  }

  if (!isEVM) return <Navigate to="/" />

  const TutorialAndShare = (
    <Flex sx={{ gap: '24px' }}>
      <Tutorial
        type={tab === VERSION.ELASTIC ? TutorialType.ELASTIC_POOLS : TutorialType.CLASSIC_POOLS}
        customIcon={
          <Flex
            sx={{ gap: '4px', cursor: 'pointer' }}
            fontSize="14px"
            alignItems="center"
            fontWeight="500"
            color={theme.subText}
            role="button"
          >
            <TutorialIcon />
            {!upToSmall && <Trans>Video Tutorial</Trans>}
          </Flex>
        }
      />

      <Flex
        sx={{ gap: '4px', cursor: 'pointer' }}
        fontSize="14px"
        alignItems="center"
        fontWeight="500"
        color={theme.subText}
        onClick={() => openShareModal()}
      >
        <Share2 size={20} />
        {!upToSmall && <Trans>Share</Trans>}
      </Flex>
    </Flex>
  )

  const selectTokenFilter = (
    <CurrencyWrapper>
      <PoolsCurrencyInputPanel
        onCurrencySelect={handleCurrencyASelect}
        onClearCurrency={handleClearCurrencyA}
        currency={currencies[Field.CURRENCY_A]}
        id="input-tokena"
        showCommonBases
      />
      <span style={{ margin: '0 6px' }}>-</span>
      <PoolsCurrencyInputPanel
        onCurrencySelect={handleCurrencyBSelect}
        onClearCurrency={handleClearCurrencyB}
        currency={currencies[Field.CURRENCY_B]}
        id="input-tokenb"
        showCommonBases
      />
    </CurrencyWrapper>
  )

  const searchFilter = (
    <Search
      searchValue={searchValueInQs}
      onSearch={onSearch}
      placeholder={t`Search by token name or pool address`}
      minWidth={'280px'}
    />
  )

  const createPoolBtn = (
    <ButtonPrimaryWithHighlight
      onClick={handleClickCreatePoolButton}
      data-highlight={shouldHighlightCreatePoolButton}
      style={{
        width: upToExtraSmall ? '36px' : 'fit-content',
        height: '36px',
        padding: upToExtraSmall ? '0' : '0px 12px',
      }}
    >
      <Plus width="16" height="16" />
      {!upToExtraSmall && (
        <Text as="span" sx={{ marginLeft: '4px' }}>
          <Trans>Create Pool</Trans>
        </Text>
      )}
    </ButtonPrimaryWithHighlight>
  )

  return (
    <>
      <PoolsPageWrapper>
        <Flex justifyContent="space-between">
          <ClassicElasticTab />
          {!upToSmall && TutorialAndShare}
        </Flex>

        <Instruction />

        <Flex justifyContent="space-between" flexDirection={upToXL ? 'column' : 'row'} sx={{ gap: '24px' }}>
          <Flex justifyContent="space-between">
            <Flex sx={{ gap: '8px' }}>
              <Tab
                role="button"
                active={!onlyShowStable && !isShowOnlyActiveFarmPools}
                onClick={() => {
                  setOnlyShowStable(false)
                  setIsShowOnlyActiveFarmPools(false)
                }}
              >
                <Trans>All</Trans>
              </Tab>

              <Tab
                role="button"
                onClick={() => {
                  setOnlyShowStable(true)
                  setIsShowOnlyActiveFarmPools(false)
                }}
                active={onlyShowStable}
              >
                <StableIcon style={{ width: '16px' }} />
                <Text marginLeft="4px">
                  <Trans>Stablecoins</Trans>
                </Text>
              </Tab>

              <Tab
                role="button"
                onClick={() => {
                  setIsShowOnlyActiveFarmPools(true)
                  setOnlyShowStable(false)
                }}
                active={isShowOnlyActiveFarmPools}
              >
                <MoneyBag size={16} />
                <Text marginLeft="4px">
                  <Trans>Farming</Trans>
                </Text>
              </Tab>
            </Flex>

            {upToSmall && createPoolBtn}
          </Flex>

          {(() => {
            if (upToMedium)
              return (
                <>
                  <Flex sx={{ gap: '1rem' }} justifyContent="space-between">
                    {selectTokenFilter}
                    {upToSmall ? TutorialAndShare : createPoolBtn}
                  </Flex>
                  <Flex sx={{ gap: '1rem' }} justifyContent="space-between">
                    <PoolSort />
                    {searchFilter}
                  </Flex>
                </>
              )

            if (upToXL)
              return (
                <Flex sx={{ gap: '1rem' }} justifyContent="space-between">
                  {selectTokenFilter}

                  <Flex sx={{ gap: '1rem' }}>
                    <ListGridViewGroup />
                    <PoolSort />
                    {searchFilter}
                    {createPoolBtn}
                  </Flex>
                </Flex>
              )

            return (
              <Flex sx={{ gap: '1rem' }}>
                <ListGridViewGroup />
                <PoolSort />
                {selectTokenFilter}
                {searchFilter}
                {createPoolBtn}
              </Flex>
            )
          })()}
        </Flex>

        {tab === VERSION.CLASSIC ? (
          <PoolList
            currencies={currencies}
            searchValue={debouncedSearchValue}
            isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            onlyShowStable={onlyShowStable}
          />
        ) : (
          <ProAmmPoolList
            currencies={currencies}
            searchValue={debouncedSearchValue}
            isShowOnlyActiveFarmPools={isShowOnlyActiveFarmPools}
            onlyShowStable={onlyShowStable}
          />
        )}
      </PoolsPageWrapper>
      <SwitchLocaleLink />

      <ModalEthPoWAck />
    </>
  )
}

export default Pools

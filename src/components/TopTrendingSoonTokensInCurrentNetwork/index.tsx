import { Trans, t } from '@lingui/macro'
import React, { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { useDispatch } from 'react-redux'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { FadeInAnimation } from 'components/Animation'
import { ButtonLight } from 'components/Button'
import Divider from 'components/Divider'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import TopTrendingSoonTokenItem from 'components/TopTrendingSoonTokensInCurrentNetwork/TopTrendingSoonTokenItem'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import useMarquee from 'hooks/useMarquee'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import useGetCoinGeckoChartData from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TextTooltip } from 'pages/TrueSight/styled'
import { AppDispatch } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { setTrendingSoonShowed } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { useShowTopTrendingSoonTokens } from 'state/user/hooks'
import { ExternalLink } from 'theme'

const TopTrendingSoonTokensInCurrentNetwork = () => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const { data: topTrendingSoonTokens, isLoading: isLoadingTrendingSoonTokens } =
    useTopTrendingSoonTokensInCurrentNetwork()
  const above768 = useMedia('(min-width: 768px)')
  const isShowTopTrendingTokens = useShowTopTrendingSoonTokens()
  const isTrendingSoonTokenDetailModalOpen = useModalOpen(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)
  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)
  const [selectedToken, setSelectedToken] = useState<TrueSightTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)

  const onDismiss = () => {
    toggleTrendingSoonTokenDetailModal()
    setSelectedToken(undefined)
  }

  const [chartTimeframe, setChartTimeframe] = useState<TrueSightTimeframe>(TrueSightTimeframe.ONE_DAY)
  const [chartCategory, setChartCategory] = useState<TrueSightChartCategory>(TrueSightChartCategory.TRADING_VOLUME)
  const tokenNetwork = useMemo(
    () => (selectedToken ? selectedToken.platforms.keys().next().value ?? undefined : undefined),
    [selectedToken],
  )
  const tokenAddress = useMemo(
    () => (selectedToken && tokenNetwork ? selectedToken.platforms.get(tokenNetwork) : undefined),
    [selectedToken, tokenNetwork],
  )
  const { data: chartData, isLoading: isChartDataLoading } = useGetCoinGeckoChartData(
    tokenNetwork,
    tokenAddress,
    chartTimeframe,
  )

  const marqueeContainerRef = useMarquee(topTrendingSoonTokens)

  const { trendingSoonShowed } = useSwapState()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    let sto: NodeJS.Timeout
    if (!trendingSoonShowed) {
      sto = setTimeout(() => {
        dispatch(setTrendingSoonShowed())
      }, 1000)
    }
    return () => {
      sto && clearTimeout(sto)
    }
  }, [dispatch, trendingSoonShowed])

  if (isLoadingTrendingSoonTokens) return above768 ? <Box height="61px" /> : <Box height="83px" />

  if (!isShowTopTrendingTokens || topTrendingSoonTokens.length === 0) return null

  if (above768)
    return (
      <>
        <Modal isOpen={isTrendingSoonTokenDetailModalOpen} onDismiss={onDismiss} maxWidth="728px">
          {selectedToken && (
            <TrendingSoonTokenDetail
              tokenData={selectedToken}
              chartData={chartData}
              isChartDataLoading={isChartDataLoading}
              chartCategory={chartCategory}
              setChartCategory={setChartCategory}
              chartTimeframe={chartTimeframe}
              setChartTimeframe={setChartTimeframe}
              setFilter={undefined}
              style={{
                width: '728px',
                height: '570px',
                padding: '20px',
              }}
            />
          )}
        </Modal>
        <FadeInAnimation $isAnimate={!trendingSoonShowed}>
          <TrendingSoonTokensAndNoteContainer>
            <TrendingSoonTokensContainer>
              <Flex
                alignItems="center"
                style={{
                  gap: '8px',
                  minWidth: 'fit-content',
                }}
              >
                <Text color={theme.subText} fontWeight={500} fontSize="14px">
                  <Trans>Trending Soon</Trans>
                </Text>
                <DiscoverIcon color={theme.subText} />
              </Flex>
              <Flex
                ref={marqueeContainerRef}
                alignItems="center"
                ml="12px"
                backgroundColor={theme.buttonBlack}
                overflow="auto"
                style={{ borderRadius: '40px', paddingLeft: '8px', flex: 1 }}
              >
                {topTrendingSoonTokens.map((tokenData, index) => (
                  <React.Fragment key={tokenData.token_id}>
                    <TopTrendingSoonTokenItem tokenData={tokenData} setSelectedToken={setSelectedToken} />
                    {index !== topTrendingSoonTokens.length - 1 && (
                      <div style={{ height: '16px', width: '0px', borderRight: '1px solid #40505A' }} />
                    )}
                  </React.Fragment>
                ))}
              </Flex>
              <ExternalLink
                href={window.location.origin + '/discover?tab=trending_soon'}
                onClickCapture={() => mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_DISCOVER_MORE_CLICKED)}
              >
                <ButtonLight
                  minWidth="fit-content"
                  width="fit-content"
                  height="100%"
                  padding="6px 12px"
                  borderRadius="20px"
                  margin="0 0 0 12px"
                  style={{ fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  <Trans>Discover more</Trans>
                </ButtonLight>
              </ExternalLink>
            </TrendingSoonTokensContainer>
          </TrendingSoonTokensAndNoteContainer>
        </FadeInAnimation>
      </>
    )

  return (
    <>
      <Modal isOpen={isTrendingSoonTokenDetailModalOpen} onDismiss={onDismiss}>
        {selectedToken && (
          <Box width="100%">
            <TrendingSoonTokenItem
              isSelected={true}
              tokenIndex={undefined}
              tokenData={selectedToken}
              onSelect={undefined}
              setIsOpenChartModal={setIsOpenChartModal}
              setFilter={undefined}
              isShowMedal={false}
            />
          </Box>
        )}
      </Modal>
      <MobileChartModal
        isOpen={isOpenChartModal}
        setIsOpen={setIsOpenChartModal}
        chartData={chartData}
        isLoading={isChartDataLoading}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
      <FadeInAnimation>
        <TrendingSoonTokensMobileContainer>
          <Flex justifyContent="space-between" alignItems="center">
            <Text
              color={theme.subText}
              fontSize="14px"
              fontWeight={500}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MouseoverTooltip text={t`Powered by TrueSight, our AI prediction model`}>
                <TextTooltip color={theme.subText}>
                  <Trans>Trending Soon</Trans>
                </TextTooltip>
              </MouseoverTooltip>
              <DiscoverIcon color={theme.subText} />
            </Text>
            <ExternalLink
              href={window.location.origin + '/discover?tab=trending_soon'}
              target="_blank"
              style={{
                fontSize: '12px',
                marginTop: '4px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Trans>Discover more</Trans>
              <ChevronRight color={theme.primary} size={16} />
            </ExternalLink>
          </Flex>

          <Flex
            marginTop="12px"
            marginBottom="20px"
            style={{
              gap: '12px',
            }}
          >
            <Flex
              ref={marqueeContainerRef}
              alignItems="center"
              style={{ overflow: 'auto', background: theme.buttonBlack, borderRadius: '999px' }}
            >
              {topTrendingSoonTokens.map((tokenData, index) => (
                <React.Fragment key={tokenData.token_id}>
                  <TopTrendingSoonTokenItem tokenData={tokenData} setSelectedToken={setSelectedToken} />
                  {index !== topTrendingSoonTokens.length - 1 && (
                    <div style={{ height: '16px', width: '0px', borderRight: '1px solid #40505A' }} />
                  )}
                </React.Fragment>
              ))}
            </Flex>
          </Flex>
          <Divider />
        </TrendingSoonTokensMobileContainer>
      </FadeInAnimation>
    </>
  )
}

const TrendingSoonTokensAndNoteContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  margin: auto;
  align-self: center;
  @media screen and (min-width: 1100px) {
    max-width: 1054px;
  }
  @media screen and (min-width: 1240px) {
    max-width: 1154px;
  }
  @media screen and (min-width: 1320px) {
    max-width: 1226px;
  }
  @media screen and (min-width: 1500px) {
    max-width: 1394px;
  }
`

const TrendingSoonTokensContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  padding: 6px 6px 6px 12px;
  background: ${({ theme }) => theme.background};
  border-radius: 999px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6px;
  `}
`

const TrendingSoonTokensMobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export default TopTrendingSoonTokensInCurrentNetwork

import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Box, Flex, Text } from 'rebass'
import { ExternalLink } from 'theme'
import { ChevronRight } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import TopTrendingSoonTokenItem from 'components/TopTrendingSoonTokensInCurrentNetwork/TopTrendingSoonTokenItem'
import { useMedia } from 'react-use'
import { TextTooltip } from 'pages/TrueSight/styled'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import { useShowTopTrendingSoonTokens } from 'state/user/hooks'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import Modal from 'components/Modal'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import useGetCoinGeckoChartData from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { ButtonLight } from 'components/Button'
import useMarquee from 'hooks/useMarquee'
import { FadeInAnimation } from 'components/Animation'

const TopTrendingSoonTokensInCurrentNetwork = () => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const {
    data: topTrendingSoonTokens,
    isLoading: isLoadingTrendingSoonTokens,
  } = useTopTrendingSoonTokensInCurrentNetwork()
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

  if (isLoadingTrendingSoonTokens) return above768 ? <Box height="66px" /> : <Box height="83px" />

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
        <FadeInAnimation>
          <TrendingSoonTokensAndNoteContainer>
            <TrendingSoonTokensContainer>
              <Flex
                alignItems="center"
                style={{
                  gap: '4px',
                  minWidth: 'fit-content',
                  flex: 1,
                }}
              >
                <Text color={theme.subText} fontWeight={500}>
                  <Trans>Trending Soon</Trans>
                </Text>
                <DiscoverIcon color={theme.subText} />
              </Flex>
              <Flex
                ref={marqueeContainerRef}
                alignItems="center"
                ml="24px"
                backgroundColor={theme.buttonBlack}
                overflow="auto"
                style={{ borderRadius: '40px', paddingLeft: '8px' }}
              >
                {topTrendingSoonTokens.map(tokenData => (
                  <React.Fragment key={tokenData.token_id}>
                    <TopTrendingSoonTokenItem tokenData={tokenData} setSelectedToken={setSelectedToken} />
                    <div style={{ height: '16px', width: '0px', borderRight: '1px solid #40505A' }} />
                  </React.Fragment>
                ))}
                <ExternalLink
                  href={window.location.origin + '/#/discover?tab=trending_soon'}
                  onClickCapture={() => mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_DISCOVER_MORE_CLICKED)}
                >
                  <ButtonLight
                    minWidth="fit-content"
                    width="fit-content"
                    height="100%"
                    padding="7px 8px"
                    borderRadius="20px"
                    margin="0 0 0 12px"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Trans>Discover more</Trans>
                  </ButtonLight>
                </ExternalLink>
              </Flex>
            </TrendingSoonTokensContainer>
            <TextNote>
              <Trans>
                Powered by <span style={{ fontWeight: 700 }}>TrueSight</span>, our AI prediction model
              </Trans>
            </TextNote>
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
            <MouseoverTooltip text={t`Powered by TrueSight, our AI prediction model`}>
              <TextTooltip
                color={theme.subText}
                fontSize="14px"
                fontWeight={500}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Text>
                  <Trans>Trending Soon</Trans>
                </Text>
                <DiscoverIcon color={theme.subText} />
              </TextTooltip>
            </MouseoverTooltip>
            <ExternalLink
              href={window.location.origin + '/#/discover?tab=trending_soon'}
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
            style={{
              gap: '12px',
              marginTop: '15px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: rgba(theme.background, 0.5),
            }}
          >
            <Flex
              ref={marqueeContainerRef}
              alignItems="center"
              style={{ overflow: 'auto', background: theme.buttonBlack, borderRadius: '40px' }}
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
  padding: 6px 12px 6px 24px;
  background: ${({ theme }) => rgba(theme.background, 0.5)};
  border-radius: 40px;
`

const TrendingSoonTokensMobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  width: 100%;
`

const TextNote = styled(Text)`
  padding: 0 12px;
  color: ${({ theme }) => theme.subText};
  font-style: italic;
  font-size: 10px;
  font-weight: 500;
  width: 100%;
  text-align: end;
`

export default TopTrendingSoonTokensInCurrentNetwork

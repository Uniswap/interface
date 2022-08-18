import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { ArrowLeft } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import {
  useShowLiveChart,
  useShowTokenInfo,
  useShowTopTrendingSoonTokens,
  useShowTradeRoutes,
  useToggleLiveChart,
  useToggleTokenInfo,
  useToggleTopTrendingTokens,
  useToggleTradeRoutes,
} from 'state/user/hooks'

import AdvancedModeSetting from './AdvancedModeSetting'
import GasPriceTrackerSetting from './GasPriceTrackerSetting'
import LiquiditySourcesSetting from './LiquiditySourcesSetting'
import SlippageSetting from './SlippageSetting'
import TransactionTimeLimitSetting from './TransactionTimeLimitSetting'

type Props = {
  className?: string
  onBack: () => void
  onClickGasPriceTracker: () => void
  onClickLiquiditySources: () => void
}
const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SettingsPanel: React.FC<Props> = ({ className, onBack, onClickLiquiditySources, onClickGasPriceTracker }) => {
  const theme = useTheme()

  const { data: topTrendingSoonTokens } = useTopTrendingSoonTokensInCurrentNetwork()
  const shouldShowTrendingSoonSetting = topTrendingSoonTokens.length > 0

  const { mixpanelHandler } = useMixpanel()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfo = useShowTokenInfo()

  const isShowLiveChart = useShowLiveChart()
  const isShowMobileLiveChart = useModalOpen(ApplicationModal.MOBILE_LIVE_CHART)

  const isShowMobileTradeRoutes = useModalOpen(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggleLiveChart = useToggleLiveChart()
  const toggleMobileLiveChart = useToggleModal(ApplicationModal.MOBILE_LIVE_CHART)
  const toggleMobileTradeRoutes = useToggleModal(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleTokenInfo = useToggleTokenInfo()

  const isShowTrendingSoonTokens = useShowTopTrendingSoonTokens()
  const toggleTopTrendingTokens = useToggleTopTrendingTokens()

  const handleToggleLiveChart = () => {
    if (isMobile) {
      if (!isShowMobileLiveChart) {
        mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_MOBILE)
      }
      toggleMobileLiveChart()
      return
    }

    mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
    toggleLiveChart()
  }

  const handleToggleTradeRoute = () => {
    if (isMobile) {
      if (!isShowMobileTradeRoutes) {
        mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_MOBILE)
      }
      toggleMobileTradeRoutes()
    } else {
      mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF, {
        trading_route_on_or_off: !isShowTradeRoutes,
      })
      toggleTradeRoutes()
    }
  }

  return (
    <Box width="100%" className={className} id={TutorialIds.TRADING_SETTING_CONTENT}>
      <Flex width={'100%'} flexDirection={'column'} marginBottom="4px">
        <Flex
          alignItems="center"
          sx={{
            // this is to make the arrow stay exactly where it stays in Info panel
            marginTop: '5px',
          }}
        >
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <BackText>{t`Settings`}</BackText>
        </Flex>

        <Flex
          sx={{
            marginTop: '22px',
            flexDirection: 'column',
            rowGap: '12px',
            width: '100%',
          }}
        >
          <span className="settingTitle">
            <Trans>Advanced Settings</Trans>
          </span>

          <SlippageSetting />
          <TransactionTimeLimitSetting />

          <AdvancedModeSetting />

          <GasPriceTrackerSetting onClick={onClickGasPriceTracker} />

          <LiquiditySourcesSetting onClick={onClickLiquiditySources} />
          <Flex
            sx={{
              flexDirection: 'column',
              rowGap: '12px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <span className="settingTitle">
              <Trans>Display Settings</Trans>
            </span>
            <AutoColumn gap="md">
              {shouldShowTrendingSoonSetting && (
                <RowBetween>
                  <RowFixed>
                    <span className="settingLabel">Trending Soon</span>
                    <QuestionHelper text={t`Turn on to display tokens that could be trending soon`} />
                  </RowFixed>
                  <Toggle isActive={isShowTrendingSoonTokens} toggle={toggleTopTrendingTokens} />
                </RowBetween>
              )}
              <RowBetween>
                <RowFixed>
                  <span className="settingLabel">Live Chart</span>
                  <QuestionHelper text={t`Turn on to display live chart`} />
                </RowFixed>
                <Toggle isActive={isMobile ? isShowMobileLiveChart : isShowLiveChart} toggle={handleToggleLiveChart} />
              </RowBetween>
              <RowBetween>
                <RowFixed>
                  <span className="settingLabel">
                    <Trans>Trade Route</Trans>
                  </span>
                  <QuestionHelper text={t`Turn on to display trade route`} />
                </RowFixed>
                <Toggle
                  isActive={isMobile ? isShowMobileTradeRoutes : isShowTradeRoutes}
                  toggle={handleToggleTradeRoute}
                />
              </RowBetween>

              <RowBetween>
                <RowFixed>
                  <span className="settingLabel">
                    <Trans>Token Info</Trans>
                  </span>
                  <QuestionHelper text={t`Turn on to display token info`} />
                </RowFixed>
                <Toggle isActive={isShowTokenInfo} toggle={toggleTokenInfo} />
              </RowBetween>
            </AutoColumn>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  .settingTitle {
    font-size: 16px;
    font-weight: 500;
  }

  .settingLabel {
    font-size: ${isMobile ? '14px' : '12px'};
    color: ${({ theme }) => theme.text};
    font-weight: 400;
    line-height: 20px;
  }

  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`

import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { ArrowLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
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
import SettingLabel from './SettingLabel'
import SlippageSetting from './SlippageSetting'
import TransactionTimeLimitSetting from './TransactionTimeLimitSetting'

type Props = {
  className?: string
  onBack: () => void
  onClickGasPriceTracker: () => void
  onClickLiquiditySources: () => void
  isLimitOrder: boolean
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

const SettingsPanel: React.FC<Props> = ({
  isLimitOrder,
  className,
  onBack,
  onClickLiquiditySources,
  onClickGasPriceTracker,
}) => {
  const theme = useTheme()

  const { data: topTrendingSoonTokens } = useTopTrendingSoonTokensInCurrentNetwork()
  const shouldShowTrendingSoonSetting = topTrendingSoonTokens.length > 0

  const { mixpanelHandler } = useMixpanel()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfo = useShowTokenInfo()

  const isShowLiveChart = useShowLiveChart()
  const toggleLiveChart = useToggleLiveChart()
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleTokenInfo = useToggleTokenInfo()

  const isShowTrendingSoonTokens = useShowTopTrendingSoonTokens()
  const toggleTopTrendingTokens = useToggleTopTrendingTokens()

  const handleToggleLiveChart = () => {
    mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
    isLimitOrder
      ? mixpanelHandler(MIXPANEL_TYPE.LO_DISPLAY_SETTING_CLICK, {
          display_setting: isShowLiveChart ? 'Live Chart Off' : 'Live Chart On',
        })
      : mixpanelHandler(MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
          display_setting: isShowLiveChart ? 'Live Chart Off' : 'Live Chart On',
        })
    toggleLiveChart()
  }

  const handleToggleTradeRoute = () => {
    mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF, {
      trading_route_on_or_off: !isShowTradeRoutes,
    })
    mixpanelHandler(MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
      display_setting: isShowTradeRoutes ? 'Trade Route Off' : 'Trade Route On',
    })
    toggleTradeRoutes()
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
          {!isLimitOrder && (
            <>
              <span className="settingTitle">
                <Trans>Advanced Settings</Trans>
              </span>

              <SlippageSetting />
              <TransactionTimeLimitSetting />
              <AdvancedModeSetting />
              <GasPriceTrackerSetting onClick={onClickGasPriceTracker} />
              <LiquiditySourcesSetting onClick={onClickLiquiditySources} />
            </>
          )}
          <Flex
            sx={{
              flexDirection: 'column',
              rowGap: '12px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <Text
              as="span"
              sx={{
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              <Trans>Display Settings</Trans>
            </Text>
            <AutoColumn gap="md">
              {shouldShowTrendingSoonSetting && (
                <RowBetween>
                  <RowFixed>
                    <SettingLabel>
                      <Trans>Trending Soon</Trans>
                    </SettingLabel>
                    <QuestionHelper text={t`Turn on to display tokens that could be trending soon`} />
                  </RowFixed>
                  <Toggle
                    isActive={isShowTrendingSoonTokens}
                    toggle={() => {
                      toggleTopTrendingTokens()
                      isLimitOrder
                        ? mixpanelHandler(MIXPANEL_TYPE.LO_DISPLAY_SETTING_CLICK, {
                            display_setting: isShowTrendingSoonTokens ? 'Trending Soon Off' : 'Trending Soon On',
                          })
                        : mixpanelHandler(MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
                            display_setting: isShowTrendingSoonTokens ? 'Trending Soon Off' : 'Trending Soon On',
                          })
                    }}
                  />
                </RowBetween>
              )}
              <RowBetween>
                <RowFixed>
                  <SettingLabel>
                    <Trans>Live Chart</Trans>
                  </SettingLabel>
                  <QuestionHelper text={t`Turn on to display live chart`} />
                </RowFixed>
                <Toggle isActive={isShowLiveChart} toggle={handleToggleLiveChart} />
              </RowBetween>
              {!isLimitOrder && (
                <>
                  <RowBetween>
                    <RowFixed>
                      <SettingLabel>
                        <Trans>Trade Route</Trans>
                      </SettingLabel>
                      <QuestionHelper text={t`Turn on to display trade route`} />
                    </RowFixed>
                    <Toggle isActive={isShowTradeRoutes} toggle={handleToggleTradeRoute} />
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <SettingLabel>
                        <Trans>Token Info</Trans>
                      </SettingLabel>
                      <QuestionHelper text={t`Turn on to display token info`} />
                    </RowFixed>
                    <Toggle
                      isActive={isShowTokenInfo}
                      toggle={() => {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
                          display_setting: isShowTokenInfo ? 'Token Info Off' : 'Token Info On',
                        })
                        toggleTokenInfo()
                      }}
                    />
                  </RowBetween>
                </>
              )}
            </AutoColumn>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`

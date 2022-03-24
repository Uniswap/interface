import React from 'react'
import { useHistory } from 'react-router'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

import DiscoverIcon from 'components/Icons/DiscoverIcon'
import TrendingIcon from 'components/Icons/TrendingIcon'
import { TrueSightTabs } from 'pages/TrueSight/index'
import { TabContainer, TabDivider, TabItem } from 'pages/TrueSight/styled'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'

const TrueSightTab = ({ activeTab }: { activeTab: TrueSightTabs | undefined }) => {
  const history = useHistory()
  const { tab } = useParsedQueryString()
  const { mixpanelHandler } = useMixpanel()

  return (
    <TabContainer>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING_SOON}
        onClick={() => {
          if (tab !== 'trending_soon') {
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_TRENDING_SOON_CLICKED)
          }
          history.push({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })
        }}
      >
        <Text>
          <Trans>Trending Soon</Trans>
        </Text>
        <DiscoverIcon size={20} />
      </TabItem>
      <TabDivider>|</TabDivider>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING}
        onClick={() => {
          if (tab !== 'trending') {
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_TRENDING_CLICKED)
          }
          history.push({ search: '?tab=' + TrueSightTabs.TRENDING })
        }}
      >
        <Text>
          <Trans>Trending</Trans>
        </Text>
        <TrendingIcon size={20} />
      </TabItem>
    </TabContainer>
  )
}

export default TrueSightTab

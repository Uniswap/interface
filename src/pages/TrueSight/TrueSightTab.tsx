import React from 'react'
import { useHistory } from 'react-router'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

import DiscoverIcon from 'components/Icons/DiscoverIcon'
import TrendingIcon from 'components/Icons/TrendingIcon'
import { TrueSightTabs } from 'pages/TrueSight/index'
import { TabContainer, TabDivider, TabItem } from 'pages/TrueSight/styled'

const TrueSightTab = ({ activeTab }: { activeTab: TrueSightTabs | undefined }) => {
  const history = useHistory()

  return (
    <TabContainer>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING_SOON}
        onClick={() => history.push({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })}
      >
        <Text>
          <Trans>Trending Soon</Trans>
        </Text>
        <DiscoverIcon size={20} />
      </TabItem>
      <TabDivider>|</TabDivider>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING}
        onClick={() => history.push({ search: '?tab=' + TrueSightTabs.TRENDING })}
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

import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'

import DiscoverIcon from 'components/Icons/DiscoverIcon'
import TrendingIcon from 'components/Icons/TrendingIcon'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { TrueSightTabs } from 'pages/TrueSight/index'
import { TabContainer, TabDivider, TabItem } from 'pages/TrueSight/styled'

const TrueSightTab = ({ activeTab }: { activeTab: TrueSightTabs | undefined }) => {
  const navigate = useNavigate()
  const { tab } = useParsedQueryString()
  const { mixpanelHandler } = useMixpanel()

  const upToSmall = useMedia('(max-width: 768px)')
  return (
    <TabContainer>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING_SOON}
        onClick={() => {
          if (tab !== 'trending_soon') {
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_TRENDING_SOON_CLICKED)
          }
          navigate({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })
        }}
      >
        <Trans>Trending Soon</Trans>
        <DiscoverIcon size={upToSmall ? 16 : 20} />
      </TabItem>
      <TabDivider>|</TabDivider>
      <TabItem
        active={activeTab === TrueSightTabs.TRENDING}
        onClick={() => {
          if (tab !== 'trending') {
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_TRENDING_CLICKED)
          }
          navigate({ search: '?tab=' + TrueSightTabs.TRENDING })
        }}
      >
        <Trans>Trending</Trans>
        <TrendingIcon size={upToSmall ? 16 : 20} />
      </TabItem>
    </TabContainer>
  )
}

export default TrueSightTab

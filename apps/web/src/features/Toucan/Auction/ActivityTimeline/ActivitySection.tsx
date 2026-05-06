import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Skeleton, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { opacifyRaw } from 'ui/src/theme'
import { ActivityTimeline } from '~/features/Toucan/Auction/ActivityTimeline/ActivityTimeline'
import { AuctionDetailsModal } from '~/features/Toucan/Auction/ActivityTimeline/AuctionDetailsModal'
import { BidActivities } from '~/features/Toucan/Auction/BidActivities/BidActivities'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

enum ActivityTab {
  Activity = 'activity',
  Timeline = 'timeline',
}

export function ActivitySection() {
  const isV2 = useFeatureFlag(FeatureFlags.AuctionDetailsV2)
  const auctionState = useAuctionStore((state) => state.progress.state)

  // V1: just show BidActivities with no tabs
  if (!isV2) {
    return <BidActivities />
  }

  if (auctionState === AuctionProgressState.UNKNOWN) {
    return (
      <Flex width="100%" gap="$spacing16">
        <Skeleton>
          <Flex height={24} width={200} borderRadius="$rounded8" backgroundColor="$neutral3" />
        </Skeleton>
        <Skeleton>
          <Flex height={120} borderRadius="$rounded16" backgroundColor="$neutral3" />
        </Skeleton>
      </Flex>
    )
  }

  return <ActivitySectionTabs isAuctionEnded={auctionState === AuctionProgressState.ENDED} />
}

function ActivitySectionTabs({ isAuctionEnded }: { isAuctionEnded: boolean }) {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const { totalBidCount } = useAuctionStatsData()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityTab>(isAuctionEnded ? ActivityTab.Timeline : ActivityTab.Activity)

  const tabVariant = media.lg ? 'subheading1' : 'heading3'

  const activityTab = (
    <TouchableArea key={ActivityTab.Activity} onPress={() => setActiveTab(ActivityTab.Activity)}>
      <Text variant={tabVariant} color={activeTab === ActivityTab.Activity ? '$neutral1' : '$neutral2'}>
        {t('toucan.auction.latestActivity')}
      </Text>
    </TouchableArea>
  )

  const timelineTab = (
    <TouchableArea key={ActivityTab.Timeline} onPress={() => setActiveTab(ActivityTab.Timeline)}>
      <Text variant={tabVariant} color={activeTab === ActivityTab.Timeline ? '$neutral1' : '$neutral2'}>
        {t('toucan.timeline.title')}
      </Text>
    </TouchableArea>
  )

  const orderedTabs = isAuctionEnded ? [timelineTab, activityTab] : [activityTab, timelineTab]

  return (
    <Flex width="100%" minWidth={0} flexShrink={1} gap="$spacing16">
      <Flex row justifyContent="space-between" alignItems="center">
        <Flex row gap="$spacing16" alignItems="center">
          {orderedTabs}
        </Flex>
        {activeTab === ActivityTab.Activity && totalBidCount !== null && totalBidCount > 0 && (
          <Flex
            row
            alignItems="center"
            gap="$spacing6"
            borderRadius="$roundedFull"
            borderWidth={1}
            borderColor="$surface3"
            px="$spacing12"
            py="$spacing6"
            style={{
              background: `linear-gradient(90deg, ${opacifyRaw(8, colors.statusSuccess.val)} 0%, transparent 100%)`,
            }}
          >
            <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor="$statusSuccess" />
            <Text variant="body3" color="$neutral1">
              {t('toucan.auction.bidCount', { bidCount: totalBidCount.toLocaleString() })}
            </Text>
          </Flex>
        )}
        {activeTab === ActivityTab.Timeline && (
          <TouchableArea
            row
            alignItems="center"
            gap="$spacing4"
            py="$spacing6"
            borderWidth={1}
            borderColor="transparent"
            onPress={() => setIsDetailsModalOpen(true)}
          >
            <Text variant="body3" color="$neutral2" hoverStyle={{ color: '$neutral1' }}>
              {t('toucan.details.seeFullDetails')}
            </Text>
            <ArrowRight color="$neutral2" size="$icon.12" />
          </TouchableArea>
        )}
      </Flex>
      {activeTab === ActivityTab.Activity ? <BidActivities hideHeader /> : <ActivityTimeline />}
      <AuctionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        initialTab="howItWorks"
      />
    </Flex>
  )
}

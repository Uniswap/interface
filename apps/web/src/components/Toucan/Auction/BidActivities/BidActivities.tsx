import { BidActivity } from 'components/Toucan/Auction/BidActivities/BidActivity'
import { FAKE_BID_ACTIVITIES } from 'components/Toucan/Auction/store/mockData'
import { useAuctionStore } from 'components/Toucan/Auction/store/useAuctionStore'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'

export const BidActivities = () => {
  const { t } = useTranslation()
  const displayMode = useAuctionStore((state) => state.displayMode)
  const surface1 = useColorHexFromThemeKey('surface1')

  return (
    <Flex width={630} minWidth={0} flexShrink={1} $lg={{ width: '100%' }} gap="$spacing24">
      <Text variant="heading3">{t('toucan.auction.bidActivity')}</Text>
      <Flex position="relative" flexGrow={1} overflow="hidden">
        <Flex gap="$spacing8" overflow="scroll">
          {FAKE_BID_ACTIVITIES.map((activity, index) => (
            <BidActivity
              key={`${activity.walletAddress}-${activity.timestamp}-${index}`}
              activity={activity}
              displayMode={displayMode}
            />
          ))}
        </Flex>

        {/* Gradient overlay - fades from transparent at top to surface1 at bottom */}
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height={216}
          pointerEvents="none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${surface1.val} 100%)`,
          }}
        />
      </Flex>
    </Flex>
  )
}

import { Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { CandlestickChart } from '@universe/mycelium/icons/CandlestickChart'
import { TestID, type TestIDType } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccount } from '~/connection/hooks/useAccount'
import { MarginChartSheet } from '~/pages/Swap/Margin/components/MarginChartSheet'
import { MarginMarketStatsRow } from '~/pages/Swap/Margin/components/MarginMarketStatsRow'
import { MarginPositionSheet, type MarginPositionSheetArgs } from '~/pages/Swap/Margin/components/MarginPositionSheet'
import { MarginForm } from '~/pages/Swap/Margin/MarginForm'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'

export type MarginMobileTab = 'trade' | 'positions'

const MOBILE_TABS: { value: MarginMobileTab; labelKey: 'common.trade' | 'pool.positions'; testID: TestIDType }[] = [
  { value: 'trade', labelKey: 'common.trade', testID: TestID.MarginMobileTabTrade },
  { value: 'positions', labelKey: 'pool.positions', testID: TestID.MarginMobileTabPositions },
]
const TAB_UNDERLINE_HEIGHT = 2

const renderPositionSheet = (args: MarginPositionSheetArgs): JSX.Element => <MarginPositionSheet {...args} />

/**
 * Margin below the tablet breakpoint: Trade / Positions tabs instead of a form with a table under it,
 * whose columns cannot fit a phone. Trade is the open form, with a "View chart" button beside the market
 * card that raises the chart as a bottom sheet; Positions lists the account's positions as cards, each
 * opening its own sheet.
 */
export function MarginMobileLayout(): JSX.Element {
  const [tab, setTab] = useState<MarginMobileTab>('trade')
  const [isChartOpen, setIsChartOpen] = useState(false)
  const openChart = useEvent(() => setIsChartOpen(true))
  const closeChart = useEvent(() => setIsChartOpen(false))

  return (
    <Flex width="100%" gap="$spacing12">
      <MarginMobileTabRow tab={tab} onSelectTab={setTab} />
      {tab === 'trade' ? (
        <MarginForm
          showInlinePositions={false}
          marketSelectorTrailing={<ViewChartButton onPress={openChart} />}
          marketSelectorFooter={<MarginMarketStatsRow />}
        />
      ) : (
        <MarginMobilePositions />
      )}
      <MarginChartSheet isOpen={isChartOpen} onClose={closeChart} />
    </Flex>
  )
}

function MarginMobileTabRow({
  tab,
  onSelectTab,
}: {
  tab: MarginMobileTab
  onSelectTab: (next: MarginMobileTab) => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row gap="$spacing24" borderBottomWidth={1} borderBottomColor="$surface3" role="tablist">
      {MOBILE_TABS.map(({ value, labelKey, testID }) => {
        const isSelected = tab === value
        return (
          <TouchableArea
            key={value}
            role="tab"
            aria-selected={isSelected}
            testID={testID}
            onPress={() => onSelectTab(value)}
          >
            <Flex gap="$spacing8">
              <Text variant="subheading1" color={isSelected ? '$neutral1' : '$neutral2'}>
                {t(labelKey)}
              </Text>
              {/* Overlaps the row's hairline, so the selected tab reads as sitting on it. */}
              <Flex height={TAB_UNDERLINE_HEIGHT} mb={-1} backgroundColor="$neutral1" opacity={isSelected ? 1 : 0} />
            </Flex>
          </TouchableArea>
        )
      })}
    </Flex>
  )
}

function ViewChartButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$spacing6"
      px="$spacing12"
      py="$spacing8"
      borderRadius="$roundedFull"
      borderWidth={1}
      borderColor="$surface3"
      hoverStyle={{ backgroundColor: '$surface2' }}
      flexShrink={0}
      testID={TestID.MarginMobileViewChart}
      onPress={onPress}
    >
      <CandlestickChart size="$icon.16" color="$neutral1" />
      <Text variant="buttonLabel3" color="$neutral1">
        {t('margin.mobile.viewChart')}
      </Text>
    </TouchableArea>
  )
}

function MarginMobilePositions(): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  // The table renders nothing without a wallet; a whole tab of nothing needs a way forward.
  if (!account.address) {
    return (
      <Flex gap="$spacing16" alignItems="center" py="$spacing24">
        <Text variant="body3" color="$neutral2">
          {t('margin.mobile.connectToViewPositions')}
        </Text>
        <Flex row width="100%">
          <Button variant="branded" size="large" fill onPress={accountDrawer.open}>
            {t('common.connectWallet.button')}
          </Button>
        </Flex>
      </Flex>
    )
  }
  return <MarginPositionsTable layout="cards" renderPositionSheet={renderPositionSheet} />
}

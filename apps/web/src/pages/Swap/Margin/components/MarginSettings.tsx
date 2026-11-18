import { Platform } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { TransactionSettingsModalStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/TransactionSettingsModalStoreContextProvider'
import { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/TransactionSettings'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { isDefaultMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginSlippageControl } from '~/pages/Swap/Margin/components/MarginSlippageControl'
import { MarginMarketOptionsScreen } from '~/pages/Swap/Margin/components/MarginVenuePreferences'

// The swap ⚙︎'s grey current value, which TransactionSettings pairs with a chevron into the screen.
function ControlValue({ children }: { children: string }): JSX.Element {
  return (
    <Text color="$neutral2" variant="subheading2" $group-hover={{ color: '$neutral2Hovered' }}>
      {children}
    </Text>
  )
}

// Margin's settings live in the margin form store, so neither reuses the swap's configs; the swap's
// deadline is left out (the margin form has none).
const MARGIN_SETTINGS: TransactionSettingConfig[] = [
  {
    renderTitle: (t) => t('margin.fees.maxSlippage'),
    applicablePlatforms: [Platform.EVM],
    Control: function MarginSlippageValue() {
      const bps = useMarginFormStore((s) => s.slippageToleranceBps)
      return <ControlValue>{`${(bps / 100).toFixed(2)}%`}</ControlValue>
    },
    Screen: () => (
      <Flex my="$spacing16">
        <MarginSlippageControl />
      </Flex>
    ),
  },
  {
    renderTitle: (t) => t('margin.settings.marketOptions'),
    applicablePlatforms: [Platform.EVM],
    Control: function MarginMarketOptionsValue() {
      const { t } = useTranslation()
      const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
      return (
        <ControlValue>{isDefaultMarginVenues({ excludedVenues }) ? t('common.all') : t('common.custom')}</ControlValue>
      )
    },
    Screen: MarginMarketOptionsScreen,
  },
]

// The Margin tab's ⚙︎: Swap's own settings popover, pager and rows, with margin's two settings.
export function MarginSettingsPopover(): JSX.Element {
  const { t } = useTranslation()
  return (
    <TransactionSettingsModalStoreContextProvider modalIds={[]}>
      <TransactionSettings
        settings={MARGIN_SETTINGS}
        position="relative"
        adjustTopAlignment={false}
        adjustRightAlignment={false}
        defaultTitle={t('common.settings')}
      />
    </TransactionSettingsModalStoreContextProvider>
  )
}

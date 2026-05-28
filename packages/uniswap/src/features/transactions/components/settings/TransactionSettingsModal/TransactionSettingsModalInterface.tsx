import { AdaptiveWebPopoverContent } from 'ui/src'
import { TransactionSettingsModalContent } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalContent/TransactionSettingsModalContent'
import { TransactionSettingsModalProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const POPOVER_WIDTH = 320

export function TransactionSettingsModalInterface({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
  isOpen,
}: TransactionSettingsModalProps): JSX.Element {
  return (
    <AdaptiveWebPopoverContent
      animation={[
        'quick',
        {
          opacity: {
            overshootClamping: true,
          },
        },
      ]}
      borderColor="$surface3"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      enterStyle={{ y: -10, opacity: 0 }}
      exitStyle={{ y: -10, opacity: 0 }}
      px="$spacing12"
      py="$spacing4"
      shadowColor="$shadowColor"
      shadowOpacity={0.06}
      shadowRadius={6}
      width={POPOVER_WIDTH}
      isOpen={isOpen}
      webBottomSheetProps={{ px: '$padding16', testID: TestID.MobileWebSettingsMenu }}
    >
      <TransactionSettingsModalContent
        defaultTitle={defaultTitle}
        initialSelectedSetting={initialSelectedSetting}
        settings={settings}
        onClose={onClose}
      />
    </AdaptiveWebPopoverContent>
  )
}

import { Button, Flex, WebBottomSheet } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MarginChartPane } from '~/pages/Swap/Margin/MarginChartPane'

// The pane fills whatever box it is given (stats strip, legend, chart, time-window row), so the sheet
// hands it a fixed one: tall enough for a readable chart, short enough to leave the page peeking above.
const MARGIN_CHART_SHEET_PANE_HEIGHT = 'min(520px, 70dvh)'

/**
 * The margin chart as a bottom sheet — the mobile layout's way to the chart, which has no column of its
 * own below the terminal breakpoint. Charts the form's market, so a market picked from the pane's header
 * carries straight back to the Trade tab.
 */
export function MarginChartSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Trace logImpression={isOpen} modal={ModalName.MarginChartSheet}>
      <WebBottomSheet isOpen={isOpen} onClose={onClose} px="$spacing12" pb="$spacing16">
        {/* WebBottomSheet keeps its children mounted while closed; gating on isOpen keeps a second
            lightweight-charts instance from running behind the Trade tab. */}
        {isOpen ? (
          <Flex width="100%" gap="$spacing16">
            <Flex height={MARGIN_CHART_SHEET_PANE_HEIGHT}>
              <MarginChartPane compact />
            </Flex>
            <Flex row>
              <Button size="large" emphasis="secondary" fill onPress={onClose} testID={TestID.MarginChartSheetClose}>
                {t('common.close')}
              </Button>
            </Flex>
          </Flex>
        ) : null}
      </WebBottomSheet>
    </Trace>
  )
}

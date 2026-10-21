import { type ColorTokens, Flex, ScrollView, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MarginExplainerContent, useMarginPnlCopy } from '~/pages/Swap/Margin/components/shared/MarginExplainer'

// Two columns, not one wide one: the copy would run to 110-character lines across a single 640px
// column, and stacked it runs past the viewport — which is what pushed this out of the popover.
// The PnL card is pinned rather than sharing the row evenly. An even split narrows the line column
// enough to wrap every entry onto a third line, which is most of the height this modal exists to
// reclaim; leaving both to `fill` sizes them by intrinsic text, so a translation would reshuffle it.
const GLOSSARY_MODAL_WIDTH = 700
const PNL_CARD_WIDTH = 264
const SWATCH_WIDTH = 16

type SwatchVariant = 'solid' | 'dashed' | 'dotted' | 'dot'

// A small line/marker sample mirroring the chart overlay it explains.
function GlossarySwatch({ color, variant }: { color: ColorTokens; variant: SwatchVariant }): JSX.Element {
  if (variant === 'dot') {
    return <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={color} />
  }
  return <Flex width={SWATCH_WIDTH} borderBottomWidth={2} borderColor={color} borderStyle={variant} />
}

interface GlossaryRow {
  key: string
  color: ColorTokens
  variant: SwatchVariant
  term: string
  copy: string
}

// Line legend: swatch + term + plain-language one-liner. The parameterized liq-line row is
// intentionally omitted — the on-chart dwell explainer covers it.
function useGlossaryRows({ leverage }: { leverage: string }): GlossaryRow[] {
  const { t } = useTranslation()
  return [
    {
      key: 'mark',
      color: '$neutral2',
      variant: 'dashed',
      term: t('margin.chart.line.current'),
      copy: t('margin.chart.explain.mark'),
    },
    {
      key: 'entry',
      color: '$statusSuccess',
      variant: 'solid',
      term: t('margin.chart.line.entry', { leverage }),
      copy: t('margin.chart.explain.entry', { leverage }),
    },
    {
      key: 'liq',
      color: '$statusCritical',
      variant: 'solid',
      term: t('margin.chart.settings.liqZone'),
      copy: t('margin.chart.explain.zone'),
    },
    {
      key: 'breakEven',
      color: '$neutral2',
      variant: 'dotted',
      term: t('margin.chart.line.breakEven'),
      copy: t('margin.chart.explain.breakEven'),
    },
    {
      key: 'previews',
      color: '$accent1',
      variant: 'dotted',
      term: t('margin.chart.settings.previewLines'),
      copy: t('margin.chart.explain.previewEntry'),
    },
    {
      key: 'markers',
      color: '$neutral2',
      variant: 'dot',
      term: t('margin.chart.settings.markers'),
      copy: t('margin.chart.explain.markers'),
    },
  ]
}

function ColumnHeading({ text }: { text: string }): JSX.Element {
  return (
    <Text variant="body2" color="$neutral1">
      {text}
    </Text>
  )
}

// Chart glossary: what each overlay means, beside how PnL is measured. Reached from the chart ⚙
// popover, which is too narrow to hold it — stacked in one column the same copy runs past the viewport.
export function MarginChartGlossaryModal({
  isOpen,
  leverage,
  onClose,
}: {
  isOpen: boolean
  leverage?: string
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const copy = useMarginPnlCopy()
  const rows = useGlossaryRows({ leverage: leverage ?? '—' })

  return (
    <Modal
      name={ModalName.MarginChartGlossary}
      isModalOpen={isOpen}
      maxWidth={GLOSSARY_MODAL_WIDTH}
      maxHeight="90vh"
      padding={0}
      onClose={onClose}
    >
      <Flex>
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12" p="$spacing20" pb="$spacing12">
          <Text variant="subheading1" color="$neutral1">
            {t('margin.chart.settings.glossaryTitle')}
          </Text>
          <TouchableArea
            p="$spacing8"
            borderRadius="$rounded8"
            hoverStyle={{ backgroundColor: '$surface2' }}
            onPress={onClose}
            testID={TestID.MarginChartGlossaryClose}
          >
            <X size="$icon.20" color="$neutral2" />
          </TouchableArea>
        </Flex>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Columns sit top-aligned: the PnL card is naturally shorter than six legend rows and
              stretching it would leave a tall empty box. */}
          <Flex
            row
            alignItems="flex-start"
            gap="$spacing24"
            px="$spacing20"
            pb="$spacing20"
            $md={{ flexDirection: 'column', gap: '$spacing20' }}
          >
            <Flex fill minWidth={0} gap="$spacing12">
              <ColumnHeading text={t('margin.chart.settings.glossaryLines')} />
              {rows.map((row) => (
                <Flex key={row.key} row gap="$spacing12" alignItems="flex-start">
                  <Flex pt="$spacing8" width={SWATCH_WIDTH} alignItems="center">
                    <GlossarySwatch color={row.color} variant={row.variant} />
                  </Flex>
                  <Flex fill minWidth={0} gap="$spacing2">
                    <Text variant="body3" color="$neutral1">
                      {row.term}
                    </Text>
                    <Text variant="body4" color="$neutral2">
                      {row.copy}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
            <Flex
              width={PNL_CARD_WIDTH}
              $md={{ width: '100%' }}
              gap="$spacing8"
              p="$spacing16"
              borderRadius="$rounded16"
              backgroundColor="$surface2"
            >
              <ColumnHeading text={copy.glossaryHeading} />
              <MarginExplainerContent lines={['lead', 'basis', 'frozen', 'roe']} />
            </Flex>
          </Flex>
        </ScrollView>
      </Flex>
    </Modal>
  )
}

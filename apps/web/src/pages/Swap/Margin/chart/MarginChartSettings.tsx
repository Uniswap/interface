import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, Switch, Tooltip } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Settings } from 'ui/src/components/icons/Settings'
import { zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { MarginChartGlossaryModal } from '~/pages/Swap/Margin/chart/MarginChartGlossaryModal'
import { type MarginChartPrefs, useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'

// Boolean-valued prefs only — the settings toggles never touch chartStyle.
type BooleanPrefKey = {
  [K in keyof MarginChartPrefs]: MarginChartPrefs[K] extends boolean ? K : never
}[keyof MarginChartPrefs]

const POPOVER_WIDTH = 288

// One settings toggle row (spec F16 template): label left, branded Switch right. Sub-rows indent;
// an optional info tooltip explains the row. Each row owns a stable, key-scoped toggle handler.
function SettingRow({
  label,
  prefKey,
  checked,
  disabled,
  indent,
  tooltip,
}: {
  label: string
  prefKey: BooleanPrefKey
  checked: boolean
  disabled?: boolean
  indent?: boolean
  tooltip?: string
}): JSX.Element {
  const setChartPrefs = useMarginChartPrefs((s) => s.setChartPrefs)
  const onCheckedChange = useEvent((next: boolean): void => {
    setChartPrefs({ [prefKey]: next } as Partial<MarginChartPrefs>)
  })
  const labelColor = disabled ? '$neutral3' : '$neutral1'
  return (
    <Flex row justifyContent="space-between" alignItems="center" py="$spacing4" pl={indent ? '$spacing16' : undefined}>
      {tooltip ? (
        <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
          <Tooltip.Trigger>
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color={labelColor}>
                {label}
              </Text>
              <InfoCircleFilled size="$icon.16" color="$neutral3" />
            </Flex>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            <Text variant="body4">{tooltip}</Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        <Text variant="body3" color={labelColor}>
          {label}
        </Text>
      )}
      <Switch
        variant="branded"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        testID={`margin-chart-settings-switch-${prefKey}`}
      />
    </Flex>
  )
}

function GroupHeading({ text }: { text: string }): JSX.Element {
  return (
    <Text variant="body4" color="$neutral2" mt="$spacing8">
      {text}
    </Text>
  )
}

// Settings body: Position (master + indented sub-rows, all disabled when no open position exists for
// this market), Chart, Privacy, then the glossary link.
function MarginChartSettingsBody({
  hasPosition,
  symbol,
  onOpenGlossary,
}: {
  hasPosition: boolean
  symbol: string
  onOpenGlossary: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const prefs = useMarginChartPrefs()
  const positionDisabled = !hasPosition
  const subDisabled = positionDisabled || !prefs.showPosition

  return (
    <Flex gap="$spacing4">
      <Text variant="subheading2" color="$neutral1">
        {t('margin.chart.settings.title')}
      </Text>

      <GroupHeading text={t('margin.chart.settings.position')} />
      <SettingRow
        label={t('margin.chart.settings.showPosition')}
        prefKey="showPosition"
        checked={prefs.showPosition}
        disabled={positionDisabled}
      />
      <SettingRow
        label={t('margin.chart.settings.liqZone')}
        prefKey="liqZone"
        checked={prefs.liqZone}
        disabled={subDisabled}
        indent
      />
      <SettingRow
        label={t('margin.chart.settings.breakEven')}
        prefKey="breakEven"
        checked={prefs.breakEven}
        disabled={subDisabled}
        indent
      />
      <SettingRow
        label={t('margin.chart.settings.markers')}
        prefKey="markers"
        checked={prefs.markers}
        disabled={subDisabled}
        indent
      />
      <SettingRow
        label={t('margin.chart.settings.summaryChip')}
        prefKey="summaryChip"
        checked={prefs.summaryChip}
        disabled={subDisabled}
        indent
      />
      {positionDisabled ? (
        <Text variant="body4" color="$neutral3" pl="$spacing4">
          {t('margin.chart.settings.noPositionHint')}
        </Text>
      ) : null}

      <GroupHeading text={t('margin.chart.settings.chart')} />
      <SettingRow label={t('margin.chart.settings.previewLines')} prefKey="previewLines" checked={prefs.previewLines} />
      <SettingRow
        label={t('margin.chart.settings.volume')}
        prefKey="volume"
        checked={prefs.volume}
        tooltip={t('margin.chart.explain.volume', { symbol })}
      />

      <GroupHeading text={t('margin.chart.settings.privacy')} />

      {/* Popover.Close, not just the handler: it closes the popover whether or not the chart pane is
          driving `open`, so the panel never stays open behind the modal it launched. */}
      <Popover.Close asChild>
        <TouchableArea mt="$spacing8" onPress={onOpenGlossary} testID={TestID.MarginChartSettingsGlossaryLink}>
          <Text variant="body3" color="$accent1">
            {t('margin.chart.settings.glossaryLink')}
          </Text>
        </TouchableArea>
      </Popover.Close>
    </Flex>
  )
}

// Chart ⚙ popover (spec F16): overlay toggles, plus the link out to the glossary of what each line
// means. hasPosition gates the whole Position group; symbol/leverage feed the volume tooltip + glossary.
export function MarginChartSettings({
  hasPosition,
  symbol,
  leverage,
  open,
  onOpenChange,
}: {
  hasPosition: boolean
  symbol: string
  leverage?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}): JSX.Element {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const openGlossary = useEvent((): void => setIsGlossaryOpen(true))
  const closeGlossary = useEvent((): void => setIsGlossaryOpen(false))

  return (
    <>
      <Popover placement="bottom-end" stayInFrame allowFlip open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger cursor="pointer">
          <Flex
            p="$spacing4"
            borderRadius="$roundedFull"
            hoverStyle={{ backgroundColor: '$surface2' }}
            testID={TestID.MarginChartSettingsGear}
          >
            <Settings size="$icon.20" color="$neutral2" />
          </Flex>
        </Popover.Trigger>
        <Popover.Content
          zIndex={zIndexes.popover}
          backgroundColor="$surface1"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded16"
          p="$spacing12"
          elevate
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
        >
          <Flex width={POPOVER_WIDTH}>
            <MarginChartSettingsBody hasPosition={hasPosition} symbol={symbol} onOpenGlossary={openGlossary} />
          </Flex>
        </Popover.Content>
      </Popover>
      {/* Outside the popover, which unmounts its content on the very close the link triggers. Mounted
          only while open, like every other margin modal: a closed Modal still renders its children for
          one exit-animation window, and this one holds the word "PnL" over the chart legend. */}
      {isGlossaryOpen ? <MarginChartGlossaryModal isOpen leverage={leverage} onClose={closeGlossary} /> : null}
    </>
  )
}

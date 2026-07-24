import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text, useMedia } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { FORMAT_DATE_LONG, useFormattedDate, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { DatePickerCard } from '~/pages/Liquidity/CreateAuction/components/DatePicker/DatePickerCard'
import { TimeLockPreset } from '~/pages/Liquidity/CreateAuction/types'

export const MIN_LOCK_DURATION_DAYS = 1

const TIMELOCK_PRESET_ORDER = [
  TimeLockPreset.ThirtyDays,
  TimeLockPreset.SixMonths,
  TimeLockPreset.OneYear,
  TimeLockPreset.Permanent,
  TimeLockPreset.Custom,
] as const

function UnlockDateReadonlyCard({
  label,
  date,
  valueText,
}: {
  label: string
  date: Date
  /** Shown instead of formatting `date` (e.g. Permanent). */
  valueText?: string
}) {
  const dayjsInstance = useLocalizedDayjs()
  const formattedDate = useFormattedDate(dayjsInstance(date), FORMAT_DATE_LONG)
  const displayValue = valueText ?? formattedDate

  return (
    <Flex
      flex={1}
      minWidth={0}
      width="100%"
      borderWidth="$spacing1"
      borderColor="$surface2"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Text variant="subheading1" color="$neutral1">
        {displayValue}
      </Text>
    </Flex>
  )
}

export function TimeLockSection({
  enabled,
  onEnabledChange,
  timeLockPreset,
  onTimeLockPresetChange,
  unlockDate,
  onUnlockDateChange,
  minUnlockDate,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  timeLockPreset: TimeLockPreset
  onTimeLockPresetChange: (preset: TimeLockPreset) => void
  unlockDate: Date
  onUnlockDateChange: (date: Date | undefined) => void
  minUnlockDate: Date
}) {
  const { t } = useTranslation()
  const media = useMedia()
  // Below md the preset dropdown and unlock-date card stack vertically full-width (mweb).
  const stackControls = Boolean(media.md)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const presetLabel = useCallback(
    (preset: TimeLockPreset) => {
      switch (preset) {
        case TimeLockPreset.ThirtyDays:
          return t('toucan.createAuction.step.customizePool.timeLock.preset.thirtyDays')
        case TimeLockPreset.SixMonths:
          return t('toucan.createAuction.step.customizePool.timeLock.preset.sixMonths')
        case TimeLockPreset.OneYear:
          return t('toucan.createAuction.step.customizePool.timeLock.preset.oneYear')
        case TimeLockPreset.Permanent:
          return t('toucan.createAuction.step.customizePool.timeLock.preset.permanent')
        case TimeLockPreset.Custom:
          return t('toucan.createAuction.step.customizePool.timeLock.preset.custom')
        default:
          return ''
      }
    },
    [t],
  )

  const selectedPresetLabel = useMemo(() => presetLabel(timeLockPreset), [presetLabel, timeLockPreset])

  const handleSelectPreset = useCallback(
    (preset: TimeLockPreset) => {
      onTimeLockPresetChange(preset)
      setDropdownOpen(false)
    },
    [onTimeLockPresetChange],
  )

  const trace = useTrace()
  // Dropdown is a custom component that doesn't forward an injected onPress, so the
  // timelock-duration click is fired here when the selector opens.
  const handleDropdownToggle = useCallback(
    (open: boolean) => {
      if (open) {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionTimelockDuration })
      }
      setDropdownOpen(open)
    },
    [trace],
  )

  return (
    <Flex gap="$spacing12">
      <Flex row alignItems="flex-start" justifyContent="space-between" gap="$spacing12">
        <Flex flex={1}>
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.createAuction.step.customizePool.timeLock')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.customizePool.timeLock.description')}
          </Text>
        </Flex>
        <Switch checked={enabled} variant="default" onCheckedChange={onEnabledChange} />
      </Flex>
      {enabled && (
        <Flex row={!stackControls} gap="$spacing12" width="100%" alignItems="stretch">
          <Flex flex={1} flexBasis={stackControls ? 'auto' : 0} minWidth={0} width="100%">
            <Dropdown
              isOpen={dropdownOpen}
              toggleOpen={handleDropdownToggle}
              isTriggerStyled={false}
              chevronSize="$icon.20"
              allowFlip
              containerStyle={{ width: '100%' }}
              dropdownStyle={{
                width: '100%',
                minWidth: '100%',
                p: '$spacing8',
                gap: '$spacing2',
                borderRadius: '$rounded16',
              }}
              buttonStyle={{
                width: '100%',
                flex: 1,
                flexShrink: 1,
                minWidth: 0,
                maxWidth: '100%',
                backgroundColor: '$surface2',
                borderWidth: 0,
                borderRadius: '$rounded16',
                p: '$spacing16',
                height: 'auto',
                minHeight: 0,
                hoverStyle: {
                  backgroundColor: '$surface3',
                },
                focusStyle: {
                  backgroundColor: '$surface3',
                },
              }}
              menuLabel={
                <Flex flex={1} flexDirection="column" gap="$spacing8" width="100%" minWidth={0} alignItems="stretch">
                  <Text variant="body3" color="$neutral2">
                    {t('toucan.createAuction.step.customizePool.timeLock.dropdownLabel')}
                  </Text>
                  <Text flex={1} minWidth={0} variant="subheading1" color="$neutral1" numberOfLines={1}>
                    {selectedPresetLabel}
                  </Text>
                </Flex>
              }
            >
              {TIMELOCK_PRESET_ORDER.map((preset) => (
                <InternalMenuItem
                  key={preset}
                  onPress={() => {
                    handleSelectPreset(preset)
                  }}
                >
                  <Text variant="buttonLabel1">{presetLabel(preset)}</Text>
                  {timeLockPreset === preset ? <Check size="$icon.16" color="$neutral1" strokeWidth={3} /> : null}
                </InternalMenuItem>
              ))}
            </Dropdown>
          </Flex>

          <Flex flex={1} flexBasis={stackControls ? 'auto' : 0} minWidth={0} width="100%" alignSelf="stretch">
            {timeLockPreset === TimeLockPreset.Custom ? (
              <DatePickerCard
                segmentedDateInput
                label={t('toucan.createAuction.step.customizePool.timeLock.unlockDate')}
                date={unlockDate}
                minDate={minUnlockDate}
                placeholder={t('toucan.createAuction.datePlaceholder')}
                onDateChange={onUnlockDateChange}
                ariaLabel={t('toucan.createAuction.step.customizePool.timeLock.unlockDate')}
                type="date"
              />
            ) : (
              <UnlockDateReadonlyCard
                label={t('toucan.createAuction.step.customizePool.timeLock.unlockDate')}
                date={unlockDate}
                valueText={
                  timeLockPreset === TimeLockPreset.Permanent
                    ? t('toucan.createAuction.step.customizePool.timeLock.preset.permanent')
                    : undefined
                }
              />
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

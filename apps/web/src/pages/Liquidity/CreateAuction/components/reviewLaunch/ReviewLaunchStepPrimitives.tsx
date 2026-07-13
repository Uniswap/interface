import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { formatTimeForDisplay } from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

export function EditButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      px="$spacing12"
      py="$spacing8"
      flexDirection="row"
      alignItems="center"
      gap="$spacing8"
      onPress={onPress}
    >
      <Edit size="$icon.20" color="$neutral1" />
      <Text variant="buttonLabel3" color="$neutral1">
        {t('common.button.edit')}
      </Text>
    </TouchableArea>
  )
}

export function SectionHeader({ title, onEdit }: { title: string; onEdit?: () => void }): JSX.Element {
  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$surface3"
      pb="$spacing12"
    >
      <Text variant="heading3" color="$neutral1">
        {title}
      </Text>
      {onEdit ? <EditButton onPress={onEdit} /> : null}
    </Flex>
  )
}

export function ReviewRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <Text variant="body1" color="$neutral2">
        {label}
      </Text>
      {children}
    </Flex>
  )
}

/** Locale-aware abbreviated date ("Feb. 10, '26") + neutral 12h/24h time, on a single line — Figma 11223:39682. */
export function ReviewAuctionDateTime({ date }: { date: Date }): JSX.Element {
  const dayjsInstance = useLocalizedDayjs()
  const { locale } = useCurrentLanguageInfo()
  const dateLabel = dayjsInstance(date).format("MMM. D, 'YY")
  const timeLabel = formatTimeForDisplay({ date, locale })
  return (
    <Flex row alignItems="center" gap="$spacing6">
      <Text variant="body1" color="$neutral1">
        {dateLabel}
      </Text>
      <Text variant="body1" color="$neutral2">
        {timeLabel}
      </Text>
    </Flex>
  )
}

import { Button, Flex, Switch, Text } from '@universe/mycelium'
import { Database } from '@universe/mycelium/icons/Database'
import { FileTextSearch } from '@universe/mycelium/icons/FileTextSearch'
import { OrderRouting } from '@universe/mycelium/icons/OrderRouting'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { HookFilterState } from '~/features/Hooks/hookFilters'
// TODO(CONS-4013): use the shared filter modal shell and neutral section names
import { PoolFilterChip, PoolFilterSection } from '~/features/Liquidity/PoolsFilter/components'
import { POOLS_FILTER_TVL_BUCKETS } from '~/features/Liquidity/PoolsFilter/constants'
import type { PoolsFilterTvlBucketId } from '~/types/poolsFilter'

export function HooksFilterModal({
  isOpen,
  onClose,
  filters,
  onChange,
  onClearAll,
  onApply,
}: {
  isOpen: boolean
  onClose: () => void
  filters: HookFilterState
  onChange: (value: HookFilterState) => void
  onClearAll: () => void
  onApply: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const descriptionId = useId()
  const titleId = useId()

  const tvlLabels: Record<PoolsFilterTvlBucketId, string> = {
    'lt-100k': t('pool.filter.tvl.under100k'),
    '100k-1m': t('pool.filter.tvl.100kTo1m'),
    'gt-10m': t('pool.filter.tvl.over10m'),
  }
  const toggles = [
    {
      field: 'routedOnly',
      label: t('hooks.filter.routed'),
      description: t('hooks.filter.routed.description'),
      Icon: OrderRouting,
    },
    {
      field: 'verifiedSourceOnly',
      label: t('hooks.filter.verifiedSource'),
      description: t('hooks.filter.verifiedSource.description'),
      Icon: FileTextSearch,
    },
    {
      field: 'metadataOnly',
      label: t('hooks.filter.metadata'),
      description: t('hooks.filter.metadata.description'),
      Icon: Database,
    },
  ] as const
  return (
    <Modal
      name={ModalName.HooksFilter}
      isModalOpen={isOpen}
      onClose={onClose}
      alignment="center"
      maxWidth={400}
      maxHeight="80vh"
      padding={0}
      testID={TestID.HooksFilterModal}
      aria-labelledby={titleId}
    >
      <Flex row alignItems="center" justifyContent="center" p="$spacing16">
        <Text tag="h2" id={titleId} variant="subheading1" color="$neutral1">
          {t('pool.filter.title')}
        </Text>
        <Flex position="absolute" right="$spacing8">
          <Button
            emphasis="text-only"
            fill={false}
            width={40}
            height={40}
            p="$none"
            aria-label={t('common.close')}
            testID={TestID.HooksFilterClose}
            onPress={onClose}
          >
            <X size="$icon.20" color="$neutral2" />
          </Button>
        </Flex>
      </Flex>
      <Flex gap="$spacing24" px="$spacing16" pb="$spacing16" minHeight={0} flexShrink={1} overflow="auto">
        <PoolFilterSection title={t('pool.filter.tvl')}>
          <Flex row flexWrap="wrap" gap="$spacing8">
            {POOLS_FILTER_TVL_BUCKETS.map((bucket) => {
              const selected = filters.tvlBucketId === bucket.id
              return (
                <PoolFilterChip
                  key={bucket.id}
                  selected={selected}
                  label={tvlLabels[bucket.id]}
                  onPress={() => onChange({ ...filters, tvlBucketId: selected ? undefined : bucket.id })}
                />
              )
            })}
          </Flex>
        </PoolFilterSection>
        {toggles.map(({ field, label, description, Icon }) => (
          <PoolFilterSection
            key={field}
            orientation="horizontal"
            title={
              <Flex flex={1} minWidth={0} gap="$spacing1">
                <Flex row alignItems="center" gap="$spacing4">
                  <Icon size="$icon.20" color="$neutral1" aria-hidden />
                  <Text variant="subheading1">{label}</Text>
                </Flex>
                <Text id={`${descriptionId}-${field}`} variant="body3" color="$neutral2">
                  {description}
                </Text>
              </Flex>
            }
          >
            <Flex $platform-web={{ transform: 'scale(0.875)', transformOrigin: 'center right' }}>
              <Switch
                checked={filters[field]}
                onCheckedChange={(checked) => onChange({ ...filters, [field]: checked })}
                variant="branded"
                aria-label={label}
                aria-describedby={`${descriptionId}-${field}`}
              />
            </Flex>
          </PoolFilterSection>
        ))}
      </Flex>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        p="$spacing12"
        borderTopWidth={1}
        borderTopColor="$surface3"
        backgroundColor="$surface1"
        $platform-web={{ position: 'sticky', bottom: 0 }}
      >
        <Button size="small" emphasis="text-only" onPress={onClearAll} testID={TestID.HooksFilterClearAll}>
          {t('pool.filter.clearAll')}
        </Button>
        <Button size="small" emphasis="primary" onPress={onApply} testID={TestID.HooksFilterApply}>
          {t('pool.filter.apply')}
        </Button>
      </Flex>
    </Modal>
  )
}

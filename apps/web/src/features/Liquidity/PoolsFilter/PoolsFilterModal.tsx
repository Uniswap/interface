import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { Button, Flex, Switch, Text, TouchableArea } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import {
  PoolFilterChip,
  PoolFilterRangeInput,
  PoolFilterRangeRow,
  PoolFilterSection,
} from '~/features/Liquidity/PoolsFilter/components'
import { POOLS_FILTER_PROTOCOLS, POOLS_FILTER_TVL_BUCKETS } from '~/features/Liquidity/PoolsFilter/constants'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import type { PoolsAprRange, PoolsFilterState, PoolsFilterTvlBucketId } from '~/types/poolsFilter'

interface PoolsFilterModalProps {
  isOpen: boolean
  onClose: () => void
  value: PoolsFilterState
  onChange: (value: PoolsFilterState) => void
  onClearAll: () => void
  onApply: () => void
  /** Min/max APR (as percent) across the surface's pools, shown as placeholder hints in the APR fields. */
  aprRange?: PoolsAprRange
  /** Selectable chains for the Network section — the surface's supported (non-SVM) set. */
  networks?: UniverseChainId[]
}

// Caps the in-modal network dropdown so its bottom sits ~16px above the modal edge (matching the side inset).
// Tuned against the rendered modal: the dropdown opens fixed from ~374px down; at this height its bottom
// lands ~16px above the modal's 736px bottom.
const NETWORK_DROPDOWN_MAX_HEIGHT = 346

/** Short percent hint for the APR fields — one decimal, no trailing zeros (e.g. 0.8, 14.4). */
function formatAprHint(value: number): string {
  return String(Math.round(value * 10) / 10)
}

export function PoolsFilterModal({
  isOpen,
  onClose,
  value,
  onChange,
  onClearAll,
  onApply,
  aprRange,
  networks,
}: PoolsFilterModalProps): JSX.Element {
  const { t } = useTranslation()

  // Labels keyed by the POOLS_FILTER_TVL_BUCKETS ids; literal t() calls so the i18n extractor finds them.
  const tvlBucketLabels: Record<PoolsFilterTvlBucketId, string> = {
    'lt-100k': t('pool.filter.tvl.under100k'),
    '100k-1m': t('pool.filter.tvl.100kTo1m'),
    'gt-10m': t('pool.filter.tvl.over10m'),
  }

  const toggleProtocol = (protocol: ProtocolVersion): void => {
    const protocols = value.protocols.includes(protocol)
      ? value.protocols.filter((p) => p !== protocol)
      : [...value.protocols, protocol]
    onChange({ ...value, protocols })
  }

  const selectChain = (chainId: UniverseChainId | undefined): void => onChange({ ...value, chainId })
  const selectTvlBucket = (id: PoolsFilterTvlBucketId): void =>
    onChange({ ...value, tvlBucketId: value.tvlBucketId === id ? undefined : id })

  return (
    <Modal
      name={ModalName.PoolsFilter}
      isModalOpen={isOpen}
      onClose={onClose}
      alignment="center"
      maxWidth={400}
      maxHeight="80vh"
      padding={0}
      testID={TestID.PoolsFilterModal}
    >
      {/* Header: centered "Filters" title with an X to close */}
      <Flex row alignItems="center" justifyContent="center" p="$spacing16">
        <Text variant="body1" color="$neutral1">
          {t('pool.filter.title')}
        </Text>
        <TouchableArea
          position="absolute"
          right="$spacing16"
          top="$spacing16"
          p="$spacing4"
          onPress={onClose}
          testID={TestID.PoolsFilterClose}
        >
          <X size="$icon.20" color="$neutral2" />
        </TouchableArea>
      </Flex>

      <Flex gap="$spacing24" px="$spacing16" pb="$spacing16">
        {/* Network */}
        <PoolFilterSection title={t('common.network')} orientation="horizontal">
          <NetworkFilter
            currentChainId={value.chainId}
            onPress={selectChain}
            showMultichainOption
            showDisplayName
            position="right"
            positionFixed
            networks={networks}
            // Shorten the dropdown so its bottom leaves the same ~16px gap to the modal edge as the sides.
            dropdownStyle={{ maxHeight: NETWORK_DROPDOWN_MAX_HEIGHT }}
          />
        </PoolFilterSection>

        {/* Protocol */}
        <PoolFilterSection title={t('common.protocol')} orientation="horizontal">
          <Flex row gap="$spacing8" alignItems="center">
            {POOLS_FILTER_PROTOCOLS.map((protocol) => (
              <PoolFilterChip
                key={protocol}
                selected={value.protocols.includes(protocol)}
                label={getProtocolVersionLabel(protocol) ?? ''}
                onPress={() => toggleProtocol(protocol)}
              />
            ))}
          </Flex>
        </PoolFilterSection>

        {/* APR */}
        <PoolFilterSection title={t('pool.apr')}>
          <PoolFilterRangeRow
            min={
              <PoolFilterRangeInput
                suffix="%"
                placeholder={aprRange ? formatAprHint(aprRange.min) : t('common.min')}
                value={value.aprMin}
                onChangeText={(aprMin) => onChange({ ...value, aprMin })}
              />
            }
            max={
              <PoolFilterRangeInput
                suffix="%"
                placeholder={aprRange ? formatAprHint(aprRange.max) : t('common.max')}
                value={value.aprMax}
                onChangeText={(aprMax) => onChange({ ...value, aprMax })}
              />
            }
          />
        </PoolFilterSection>

        {/* Rewards */}
        <PoolFilterSection title={t('pool.rewards')} orientation="horizontal">
          {/* SwitchCompat has fixed 32px geometry; scale to the 28px Figma track (thumb 21px). */}
          <Flex $platform-web={{ transform: 'scale(0.875)', transformOrigin: 'center right' }}>
            <Switch
              checked={value.rewardsOnly}
              onCheckedChange={(rewardsOnly) => onChange({ ...value, rewardsOnly })}
              variant="branded"
            />
          </Flex>
        </PoolFilterSection>

        {/* TVL */}
        <PoolFilterSection title={t('pool.filter.tvl')}>
          <Flex row flexWrap="wrap" gap="$spacing8" alignItems="center">
            {POOLS_FILTER_TVL_BUCKETS.map((bucket) => (
              <PoolFilterChip
                key={bucket.id}
                selected={value.tvlBucketId === bucket.id}
                label={tvlBucketLabels[bucket.id]}
                onPress={() => selectTvlBucket(bucket.id)}
              />
            ))}
          </Flex>
        </PoolFilterSection>
      </Flex>

      {/* Footer — pinned to the bottom of the modal's scroll area */}
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
        <Button size="small" emphasis="text-only" testID={TestID.PoolsFilterClearAll} onPress={onClearAll}>
          {t('pool.filter.clearAll')}
        </Button>
        <Button size="small" emphasis="primary" testID={TestID.PoolsFilterApply} onPress={onApply}>
          {t('pool.filter.apply')}
        </Button>
      </Flex>
    </Modal>
  )
}

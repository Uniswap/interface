import { useQuery } from '@tanstack/react-query'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import {
  type UniverseChainId,
  AddressStringFormat,
  Platform,
  areEvmAddressesEqual,
  getValidAddress,
  normalizeAddress,
} from '@universe/chains'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { DocumentList } from '@universe/mycelium/icons/DocumentList'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { hookRegistryQueryOptions } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import {
  type UniswapHookProvenance,
  getUniswapHookProvenanceLabel,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getAddress } from '~/chains'
import { HookCard } from '~/features/Liquidity/HookCard'
import { UniswapBuiltHookIcon } from '~/features/Liquidity/UniswapBuiltHookIcon'
import { getActiveHookFlags } from '~/features/Liquidity/utils/getActiveHookFlags'

interface HookSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectHook: (hook: HookEntry) => void
  onSelectAddress: (address: string) => void
  chainId?: UniverseChainId
  selectedHook?: string
}

/** Runway the "Add hook" overlay gives its background gradient before the pill starts. */
const HOVER_PILL_FADE_WIDTH = 48
const HOVER_PILL_FADE_MASK = `linear-gradient(to right, transparent, black ${HOVER_PILL_FADE_WIDTH}px)`

function HookRow({
  hook,
  selected,
  onSelect,
  provenance,
}: {
  hook: HookEntry
  selected: boolean
  onSelect: (hook: HookEntry) => void
  provenance?: UniswapHookProvenance
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const activeFlags = useMemo(() => getActiveHookFlags(hook.flags), [hook.flags])
  const isUniswapHook = provenance !== undefined
  // Rows for hooks Uniswap built or configured are always expandable so their provenance badge stays
  // reachable even when the registry entry carries no description or flags.
  const hasExpandableContent = isUniswapHook || !!hook.description || activeFlags.length > 0

  return (
    <Flex
      group="item"
      p="$spacing8"
      // The row paints its own opaque surface instead of letting the modal's show through a
      // transparent row: the hover-pill overlay below inherits this background as its scrim, so the
      // row's rest / hover / selected paint is defined here only, with nothing to keep in sync.
      backgroundColor={selected ? '$surface3' : '$surface1'}
      hoverStyle={{ backgroundColor: '$surface1Hovered' }}
      borderRadius="$rounded16"
    >
      {/* `background-color: inherit` carries the row's paint down to the overlay's parent chain. */}
      <Flex row alignItems="center" gap="$gap12" position="relative" className="[background-color:inherit]">
        <TouchableArea flex={1} onPress={hasExpandableContent ? () => setExpanded((prev) => !prev) : undefined}>
          <HookCard
            address={hook.address}
            name={hook.name}
            chain={hook.chain}
            chainId={isUniverseChainId(hook.chainId) ? hook.chainId : undefined}
            logo={isUniswapHook ? <UniswapBuiltHookIcon /> : undefined}
            copyableAddress
            addressEndAdornment={
              hasExpandableContent ? (
                <Flex display={expanded ? 'flex' : 'none'} $group-item-hover={{ display: 'flex' }}>
                  <RotatableChevron direction={expanded ? 'up' : 'down'} color="$neutral3" size="$icon.16" />
                </Flex>
              ) : undefined
            }
          />
        </TouchableArea>
        {selected ? (
          <Check size="$icon.20" color="$accent1" />
        ) : (
          // Overlaid rather than in-flow so revealing the pill can't shrink the name column and wrap a
          // long hook name. The scrim inherits the row's background — rest, hover and selected alike,
          // via CSS inheritance rather than a second copy of the token — and the mask fades it in from
          // the left, so the name passes under the pill instead of colliding with it. The reveal is the
          // Tailwind twin of the row's `group="item"` marker, so it beats the base `hidden` on hover.
          <Flex
            row
            alignItems="center"
            position="absolute"
            top={0}
            bottom={0}
            right={0}
            pl={HOVER_PILL_FADE_WIDTH}
            pointerEvents="none"
            display={expanded || !hasExpandableContent ? 'flex' : 'none'}
            className="[background-color:inherit] group-hover/item:flex"
            style={{ maskImage: HOVER_PILL_FADE_MASK, WebkitMaskImage: HOVER_PILL_FADE_MASK }}
          >
            <Flex pointerEvents="auto">
              <Button
                size="xxsmall"
                emphasis="secondary"
                fill={false}
                testID={TestID.HookRowAddButton}
                onPress={() => onSelect(hook)}
              >
                {t('hook.search.addHookButton')}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
      {expanded && (
        <Flex gap="$gap8" mt="$spacing8" p="$spacing12" backgroundColor="$surface2" borderRadius="$rounded12">
          {provenance !== undefined ? (
            <Flex row alignItems="center" gap="$gap4">
              <UniswapLogo size="$icon.12" color="$accent1" />
              <Text variant="body4" color="$accent1">
                {getUniswapHookProvenanceLabel({ provenance, t })}
              </Text>
            </Flex>
          ) : null}
          {hook.description ? (
            <Text variant="body3" color="$neutral1">
              {hook.description}
            </Text>
          ) : null}
          {activeFlags.length > 0 && (
            <Flex flexDirection="row" flexWrap="wrap" gap="$gap4">
              {activeFlags.map((flag) => (
                <Flex key={flag} backgroundColor="$surface3" borderRadius="$rounded8" px="$spacing8" py="$spacing4">
                  <Text variant="monospace" color="$neutral2">
                    {flag}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  )
}

function UnregisteredHookRow({
  address,
  chainId,
  onSelect,
}: {
  address: string
  chainId?: UniverseChainId
  onSelect: (address: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Flex
      group="item"
      row
      alignItems="center"
      gap="$gap12"
      p="$spacing8"
      hoverStyle={{ backgroundColor: '$surface1Hovered' }}
      borderRadius="$rounded16"
    >
      <Flex flex={1}>
        <HookCard
          address={address}
          chainId={chainId}
          icon={<DocumentList size={20} color="$neutral1" />}
          copyableAddress
        />
      </Flex>
      <Button
        size="xxsmall"
        emphasis="secondary"
        fill={false}
        testID={TestID.HookRowAddButton}
        onPress={() => onSelect(address)}
      >
        {t('hook.search.addHookButton')}
      </Button>
    </Flex>
  )
}

export function HookSearchModal({
  isOpen,
  onClose,
  onSelectHook,
  onSelectAddress,
  chainId,
  selectedHook,
}: HookSearchModalProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const getUniswapHookProvenance = useUniswapHookProvenance()

  // Fetch this chain's registry once (session-cached) and filter it client-side instead of fetching
  // per keystroke. The list below is empty without a chain, so don't fetch until one is known.
  const { data, isLoading } = useQuery({ ...hookRegistryQueryOptions({ chainId }), enabled: !!chainId })

  const query = searchValue.trim().toLowerCase()

  // Registry hooks for the chain, in one list; the ones Uniswap built or configured are badged inline
  // rather than pulled into a separate section.
  const hooks = useMemo(() => {
    if (!chainId) {
      return []
    }
    return (data?.hooks ?? []).filter(
      (hook) =>
        !query ||
        hook.name.toLowerCase().includes(query) ||
        normalizeAddress(hook.address, AddressStringFormat.Lowercase).startsWith(query),
    )
  }, [data, chainId, query])

  // A pasted address that isn't in either list still renders a selectable entry (checksummed first)
  const searchedAddress = useMemo(() => {
    const trimmed = searchValue.trim()
    const checksummedAddress = getValidAddress({ address: trimmed, withEVMChecksum: true, platform: Platform.EVM })
    if (checksummedAddress) {
      return checksummedAddress
    }
    try {
      return getAddress(trimmed)
    } catch {
      return null
    }
  }, [searchValue])

  const unregisteredAddress =
    searchedAddress && !isLoading && !hooks.some((hook) => areEvmAddressesEqual(hook.address, searchedAddress))
      ? searchedAddress
      : undefined

  return (
    <Modal
      name={ModalName.HookSearch}
      onClose={onClose}
      isDismissible
      isModalOpen={isOpen}
      padding="$none"
      maxWidth={480}
    >
      <Flex gap="$spacing8" width="100%">
        <Flex row alignItems="center" justifyContent="space-between" pt="$spacing16" px="$spacing16">
          <Text variant="subheading1">{t('hook.search.title')}</Text>
          <ModalCloseIcon onClose={onClose} />
        </Flex>

        <SearchTextInput
          autoFocus
          backgroundColor="$surface2"
          placeholder={t('hook.search.placeholder')}
          mx="$spacing16"
          my="$spacing4"
          value={searchValue}
          onChangeText={setSearchValue}
        />

        <Flex overflow="auto" minHeight={400} maxHeight={400}>
          <Flex px="$spacing8" pb="$spacing8">
            {isLoading ? (
              <Flex py="$padding24" alignItems="center">
                <Text variant="body2" color="$neutral3">
                  {t('common.loading')}
                </Text>
              </Flex>
            ) : hooks.length === 0 && !unregisteredAddress ? (
              <Flex py="$padding24" alignItems="center">
                <Text variant="body2" color="$neutral3">
                  {t('hook.search.empty')}
                </Text>
              </Flex>
            ) : (
              <>
                {hooks.map((hook) => (
                  <HookRow
                    key={hook.address}
                    hook={hook}
                    provenance={getUniswapHookProvenance({ chainId, address: hook.address })}
                    selected={areEvmAddressesEqual(hook.address, selectedHook)}
                    onSelect={(entry) => {
                      onSelectHook(entry)
                      onClose()
                    }}
                  />
                ))}
                {unregisteredAddress && (
                  <UnregisteredHookRow
                    address={unregisteredAddress}
                    chainId={chainId}
                    onSelect={(address) => {
                      onSelectAddress(address)
                      onClose()
                    }}
                  />
                )}
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}

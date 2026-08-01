import { useQuery } from '@tanstack/react-query'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, ScrollView, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { areEvmAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'
import { getAddress } from '~/chains'
import { HookCard } from '~/features/Liquidity/HookCard'
import { getActiveHookFlags } from '~/features/Liquidity/utils/getActiveHookFlags'
import { hookRegistryQueryOptions } from '~/hooks/useHookRegistryMap'

interface HookSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectHook: (hook: HookEntry) => void
  onSelectAddress: (address: string) => void
  chainId?: UniverseChainId
  selectedHook?: string
}

function HookRow({
  hook,
  selected,
  onSelect,
}: {
  hook: HookEntry
  selected: boolean
  onSelect: (hook: HookEntry) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const activeFlags = useMemo(() => getActiveHookFlags(hook.flags), [hook.flags])
  const hasExpandableContent = !!hook.description || activeFlags.length > 0

  return (
    <Flex
      group="item"
      p="$spacing8"
      backgroundColor={selected ? '$surface3' : undefined}
      hoverStyle={{ backgroundColor: '$surface1Hovered' }}
      borderRadius="$rounded16"
    >
      <Flex row alignItems="center" gap="$gap12">
        <TouchableArea flex={1} onPress={hasExpandableContent ? () => setExpanded((prev) => !prev) : undefined}>
          <HookCard
            address={hook.address}
            name={hook.name}
            chain={hook.chain}
            chainId={isUniverseChainId(hook.chainId) ? hook.chainId : undefined}
            verified={hook.verifiedSource}
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
          <Flex display={expanded || !hasExpandableContent ? 'flex' : 'none'} $group-item-hover={{ display: 'flex' }}>
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
        )}
      </Flex>
      {expanded && (
        <Flex gap="$gap8" mt="$spacing8" p="$spacing12" backgroundColor="$surface2" borderRadius="$rounded12">
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

  // Filter the session-cached registry client-side instead of fetching per keystroke
  const { data, isLoading } = useQuery(hookRegistryQueryOptions())

  const hooks = useMemo(() => {
    if (!chainId) {
      return []
    }
    const query = searchValue.trim().toLowerCase()
    return (data?.hooks ?? []).filter(
      (hook) => hook.chainId === chainId && (!query || hook.name.toLowerCase().includes(query)),
    )
  }, [data, chainId, searchValue])

  // A pasted address that isn't in the registry still renders a selectable entry (checksummed first)
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
      maxWidth={420}
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

        <ScrollView minHeight={400} maxHeight={400}>
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
        </ScrollView>
      </Flex>
    </Modal>
  )
}

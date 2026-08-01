import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Text, TouchableArea } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout/Flex'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { HookCard } from '~/features/Liquidity/HookCard'
import { getHookRegistryKey, useHookRegistryMap } from '~/hooks/useHookRegistryMap'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

export function AddHook() {
  const { t } = useTranslation()

  const { hook: initialHook } = useLiquidityUrlState()
  const {
    positionState: { hook, protocolVersion },
    currencies,
    setPositionState,
    setHookSearchModalOpen,
    selectedHookEntry,
    setSelectedHookEntry,
  } = useCreateLiquidityContext()
  // Hooks are chain-specific: use the chain of the tokens the user has selected, not the app-level chain
  const chainId = (currencies.display.TOKEN0?.chainId ?? currencies.display.TOKEN1?.chainId) as
    | UniverseChainId
    | undefined

  // Resolve the hook address against the session-cached hook registry (one cross-chain fetch,
  // then synchronous map lookups) instead of issuing a per-address backend query. Deferred until
  // a hook is actually set so merely mounting AddHook doesn't fetch the registry.
  const hookRegistryMap = useHookRegistryMap({ enabled: !!hook || !!initialHook })
  const registryHookEntry =
    hook && chainId ? hookRegistryMap?.get(getHookRegistryKey({ chainId, hookAddress: hook })) : undefined
  const hookEntry = selectedHookEntry ?? registryHookEntry

  useEffect(() => {
    if (initialHook && protocolVersion === ProtocolVersion.V4) {
      setPositionState((state) => ({
        ...state,
        hook: initialHook,
      }))
    }
  }, [initialHook, protocolVersion, setPositionState])

  const onClearHook = useCallback(() => {
    setSelectedHookEntry(undefined)
    setPositionState((state) => ({ ...state, hook: undefined, userApprovedHook: undefined, fee: undefined }))
  }, [setSelectedHookEntry, setPositionState])

  if (hook) {
    return (
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        py="$padding12"
        px="$padding16"
        gap="$gap12"
      >
        <TouchableArea onPress={() => setHookSearchModalOpen(true)} flex={1}>
          <HookCard
            address={hook}
            name={hookEntry?.name}
            chain={hookEntry?.chain}
            chainId={isUniverseChainId(hookEntry?.chainId) ? hookEntry.chainId : chainId}
            verified={hookEntry?.verifiedSource}
          />
        </TouchableArea>
        <TouchableArea
          testID={TestID.HookClearButton}
          onPress={(e) => {
            e.preventDefault()
            onClearHook()
          }}
        >
          <X size="$icon.20" color="$neutral3" />
        </TouchableArea>
      </Flex>
    )
  }

  return (
    <Flex
      testID={TestID.HookAddButton}
      row
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      py="$padding12"
      px="$padding16"
      gap="$gap12"
    >
      <Flex flex={1}>
        <Flex row alignItems="center" gap="$gap4">
          <Text variant="body2" color="$neutral1">
            {t('position.addHook')}
          </Text>
          <Text variant="body2" color="$neutral3">
            {t('common.optional')}
          </Text>
        </Flex>
        <Text variant="body3" color="$neutral2">
          {t('position.addHook.subtitle')}
        </Text>
      </Flex>
      <Trace logPress element={ElementName.AddHook}>
        <Button
          size="xsmall"
          emphasis="secondary"
          fill={false}
          icon={<Search size="$icon.16" />}
          testID={TestID.HookSelectButton}
          onPress={() => setHookSearchModalOpen(true)}
        >
          {t('common.button.search')}
        </Button>
      </Trace>
    </Flex>
  )
}

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { AnimatedFlex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { X } from 'ui/src/components/icons/X'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { HookCard } from '~/features/Liquidity/HookCard'
import { UniswapBuiltHookIcon } from '~/features/Liquidity/UniswapBuiltHookIcon'
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

  // Resolve the hook address against the session-cached registry for the selected tokens' chain (one
  // fetch per chain, then synchronous map lookups) instead of issuing a per-address backend query.
  // The lookup needs both a hook and its chain, so don't fetch until both are known — merely
  // mounting AddHook fetches nothing.
  const hookRegistryMap = useHookRegistryMap({ chainId, enabled: !!chainId && (!!hook || !!initialHook) })
  const registryHookEntry =
    hook && chainId ? hookRegistryMap?.get(getHookRegistryKey({ chainId, hookAddress: hook })) : undefined
  const hookEntry = selectedHookEntry ?? registryHookEntry

  const getUniswapHookProvenance = useUniswapHookProvenance()

  // Seeds position state from `?hook=` on mount and again if the version flips to v4. Note for callers
  // that clear the hook while this is unmounted: the next mount re-seeds it from the URL until the
  // provider's sync has caught up, so return to this step first and clear afterwards.
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
    // One resolved chain for both the badge predicate and the card — the registry entry's chain when
    // it's a known universe chain, else the token chain — so the two can't key on different chains.
    const hookChainId = isUniverseChainId(hookEntry?.chainId) ? hookEntry.chainId : chainId
    const isUniswapHook = getUniswapHookProvenance({ chainId: hookChainId, address: hook }) !== undefined
    return (
      <AnimatedFlex
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
            chainId={hookChainId}
            logo={isUniswapHook ? <UniswapBuiltHookIcon /> : undefined}
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
      </AnimatedFlex>
    )
  }

  return (
    <AnimatedFlex
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
      <AnimatedFlex flex={1}>
        <AnimatedFlex row alignItems="center" gap="$gap4">
          <Text variant="body2" color="$neutral1">
            {t('position.addHook')}
          </Text>
          <Text variant="body2" color="$neutral3">
            {t('common.optional')}
          </Text>
        </AnimatedFlex>
        <Text variant="body3" color="$neutral2">
          {t('position.addHook.subtitle')}
        </Text>
      </AnimatedFlex>
      <Trace logPress element={ElementName.AddHook}>
        <Button
          size="xsmall"
          emphasis="secondary"
          fill={false}
          icon={<Search size="$icon.16" />}
          testID={TestID.HookSelectButton}
          onPress={() => setHookSearchModalOpen(true)}
        >
          {/* i18next resolves this key's trailing `.search` against `String.prototype`, so
              `t()` types as `string | String['search']` and the function half needs casting off. */}
          {t('common.button.search') as string}
        </Button>
      </Trace>
    </AnimatedFlex>
  )
}

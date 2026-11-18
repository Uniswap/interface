import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { type UniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getHookRegistryKey } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { shortenAddress } from 'utilities/src/addresses'
import { MouseoverTooltip } from '~/components/Tooltip'
import { DynamicFeeIcon, DynamicFeeTooltipContent, useDynamicFeeLabel } from '~/features/Liquidity/DynamicFee'
import { HookNameText } from '~/features/Liquidity/PoolsTable/components/HookNameText'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'

/** A dynamic tier's live rate behind an icon, with a hover note that the fee floats. */
function DynamicFeeLabel({ currentLpFeePips }: { currentLpFeePips?: number }) {
  const { label, hasCurrentFee } = useDynamicFeeLabel(currentLpFeePips)

  // InfoTooltip's own wrapper shrinks, which would ellipsize the rate in a squeezed row; the rate stays
  // whole and the hook name gives up the space instead.
  return (
    <Flex flexShrink={0}>
      <InfoTooltip
        placement="top"
        trigger={
          <Flex row alignItems="center" gap="$gap4" flexShrink={0}>
            <DynamicFeeIcon />
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {label}
            </Text>
          </Flex>
        }
        text={<DynamicFeeTooltipContent hasCurrentFee={hasCurrentFee} />}
      />
    </Flex>
  )
}

export function PoolDetailsLine({
  chainId,
  protocolVersion,
  feeTier,
  currentLpFeePips,
  hookAddress,
  protocolFeePips,
  hookRegistry,
  categoryTag,
}: {
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  currentLpFeePips?: number
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
  /** Sits at the end of the details line, not beside the pair name (Figma). */
  categoryTag?: PoolCategory
}) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const getUniswapHookProvenance = useUniswapHookProvenance()

  const poolHookAddress = hookAddress && !areEvmAddressesEqual(hookAddress, ZERO_ADDRESS) ? hookAddress : undefined
  const hookEntry = poolHookAddress
    ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress: poolHookAddress }))
    : undefined
  // A hook the registry doesn't list (or hasn't loaded yet) still belongs on the line — show its
  // truncated address rather than dropping it, so a hooked pool never reads as hookless. Empty when the
  // served value isn't a valid address, which shortenAddress can't truncate.
  const shortHookAddress = poolHookAddress ? shortenAddress({ address: poolHookAddress }) : ''
  // Keyed on the trusted `chainId` the table is showing (the one that built the registry key above), not
  // the entry's self-reported chainId, so a response claiming another chain can't earn that chain's badge.
  const provenance = hookEntry ? getUniswapHookProvenance({ chainId, address: hookEntry.address }) : undefined
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  const isDynamic = feeTier ? isDynamicFeeTier(feeTier) : false
  // Dynamic tiers are excluded: their feeAmount is a sentinel, not a rate.
  const feeBreakdown =
    feeTier && restProtocolVersion !== undefined && !isDynamic
      ? getFeeBreakdown({
          feeAmount: feeTier.feeAmount,
          protocolVersion: restProtocolVersion,
          servedProtocolFeeBps: protocolFeePips !== undefined ? feeAmountToBps(protocolFeePips) : undefined,
        })
      : undefined

  const feeNode = !feeTier ? null : isDynamic ? (
    <DynamicFeeLabel currentLpFeePips={currentLpFeePips} />
  ) : (
    <FeeDisplay feeBreakdown={feeBreakdown}>
      <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {formatPercent(feeTier.feeAmount / BIPS_BASE, 4)}
      </Text>
    </FeeDisplay>
  )

  const hookNode = hookEntry ? (
    <HookNameText hookEntry={hookEntry} chainId={chainId} provenance={provenance} />
  ) : poolHookAddress && shortHookAddress ? (
    // No registry entry means no name, description or flags to open a details dialog on, so the address
    // is plain text with the full value on hover — matching the position badges.
    <MouseoverTooltip
      text={t('liquidity.hooks.address.tooltip', { address: poolHookAddress })}
      placement="top"
      style={{ minWidth: 0 }}
    >
      <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {shortHookAddress}
      </Text>
    </MouseoverTooltip>
  ) : null

  const segments = [
    protocolVersion ? (
      <Text key="version" variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {protocolVersion}
      </Text>
    ) : null,
    feeNode ? <Fragment key="fee">{feeNode}</Fragment> : null,
    hookNode ? <Fragment key="hook">{hookNode}</Fragment> : null,
  ].filter((segment) => segment !== null)

  if (segments.length === 0 && !categoryTag) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap4" minWidth={0} maxWidth="100%">
      {segments.map((segment, index) => (
        <Fragment key={segment.key}>
          {index > 0 ? (
            <Text variant="body3" color="$neutral2" flexShrink={0}>
              ·
            </Text>
          ) : null}
          {segment}
        </Fragment>
      ))}
      {categoryTag ? (
        <Flex ml="$spacing4" flexShrink={0} testID={TestID.PoolRowCategoryTag}>
          <TokenCategoryTag category={categoryTag} />
        </Flex>
      ) : null}
    </Flex>
  )
}

import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, Tooltip } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { V2_DEFAULT_FEE_TIER, V2_PROTOCOL_FEE_PIPS } from 'uniswap/src/constants/pools'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { Portal } from '~/components/Popups/Portal'
import { HookDetailsModal } from '~/features/Liquidity/HookDetailsModal'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { getProtocolVersionFromLabel, getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { getHookRegistryKey, useHookRegistryMap } from '~/hooks/useHookRegistryMap'

const PositionInfoBadge = styled(Text, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing2',
  variant: 'body3',
  color: '$neutral2',
  backgroundColor: '$surface3',
  py: '$spacing2',
  px: '$padding6',
  variants: {
    size: {
      default: {
        variant: 'body3',
      },
      small: {
        variant: 'body4',
      },
    },
    placement: {
      start: {
        borderTopLeftRadius: '$rounded4',
        borderBottomLeftRadius: '$rounded4',
      },
      middle: {},
      end: {
        borderTopRightRadius: '$rounded4',
        borderBottomRightRadius: '$rounded4',
      },
      only: {
        borderRadius: '$rounded4',
      },
    },
  } as const,
})

function getPlacement(index: number, length: number): 'start' | 'middle' | 'end' | 'only' {
  return length === 1 ? 'only' : index === 0 ? 'start' : index === length - 1 ? 'end' : 'middle'
}

interface BadgeData {
  label: string
  tooltipContent?: string
  copyable?: boolean
  truncate?: boolean
  icon?: JSX.Element
  iconAfter?: JSX.Element
  onPress?: () => void
  // Flag on: wraps the fee badge in a FeeDisplay so the plain % gains a hover breakdown.
  feeBreakdown?: FeeBreakdown
}

interface BadgeCta extends BadgeData {
  onPress: () => void
}

export function LiquidityPositionInfoBadges({
  version,
  v4hook,
  chainId,
  feeTier,
  protocolFeePips,
  feeBreakdown: feeBreakdownOverride,
  size,
  cta,
}: {
  version?: RestProtocolVersion | GraphQLApi.ProtocolVersion | string
  v4hook?: string
  chainId?: UniverseChainId
  feeTier?: FeeData
  protocolFeePips?: number
  // Pre-computed breakdown for the fee badge, overriding the served-from-`protocolFeePips` path. The
  // create/migrate flow passes this so the badge can reveal a curve-derived fee for a pool that doesn't
  // exist yet (the backend has no served value); read surfaces keep passing `protocolFeePips`.
  feeBreakdown?: FeeBreakdown
  size: 'small' | 'default'
  cta?: BadgeCta
}): JSX.Element {
  const { t } = useTranslation()
  const [showHookDetails, setShowHookDetails] = useState(false)
  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)

  const hookRegistry = useHookRegistryMap()
  const hookEntry =
    v4hook && v4hook !== ZERO_ADDRESS && chainId
      ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress: v4hook }))
      : undefined

  const badges = useMemo(() => {
    const versionLabel = version
      ? typeof version === 'string'
        ? version.toLowerCase()
        : getProtocolVersionLabel(version)
      : undefined

    const isV2 = versionLabel === 'v2'
    // v2 carries no explicit feeTier; fall back to the fixed 0.3% tier so the breakdown still renders.
    const feeAmount = feeTier ? feeTier.feeAmount : isV2 ? V2_DEFAULT_FEE_TIER : undefined
    const restProtocolVersion = getProtocolVersionFromLabel(versionLabel)
    // Flag on: attach a FeeBreakdown to the fee badge so it renders a FeeDisplay hover breakdown.
    // The protocol fee is backend-served or nothing (the FE never computes fees); with no served
    // value FeeDisplay drops the tooltip and the badge stays a plain %. pips -> bps is exact (/100).
    // Dynamic tiers keep the plain "Dynamic" label — their feeAmount is a sentinel, not a rate.
    const isDynamic = feeTier ? isDynamicFeeTier(feeTier) : false
    // v2's protocol fee is fixed and its payload serves none, so fall back to the constant. A
    // caller-provided value still wins.
    const effectiveProtocolFeePips = protocolFeePips ?? (isV2 ? V2_PROTOCOL_FEE_PIPS : undefined)
    // A caller-supplied breakdown (create/migrate curve path) wins; otherwise build the served
    // breakdown from `protocolFeePips`. Both are gated so the tooltip only appears with the flag on.
    const feeBreakdown =
      feeBreakdownOverride ??
      (isFeeDisplayEnabled && feeAmount !== undefined && restProtocolVersion !== undefined && !isDynamic
        ? getFeeBreakdown({
            feeAmount,
            protocolVersion: restProtocolVersion,
            servedProtocolFeeBps:
              effectiveProtocolFeePips !== undefined ? feeAmountToBps(effectiveProtocolFeePips) : undefined,
          })
        : undefined)

    const feeTierLabel = feeTier
      ? isDynamic
        ? { label: t('common.dynamic') }
        : { label: `${feeTier.feeAmount / BIPS_BASE}%`, feeBreakdown }
      : isV2
        ? { label: `${V2_DEFAULT_FEE_TIER / BIPS_BASE}%`, feeBreakdown }
        : undefined

    return [
      versionLabel ? { label: versionLabel } : undefined,
      v4hook && v4hook !== ZERO_ADDRESS
        ? hookEntry
          ? // Registry-known hook: show its name and open the details dialog on click (the dialog
            // has the copyable address).
            {
              label: hookEntry.name || v4hook,
              tooltipContent: t('liquidity.hooks.address.tooltip', { address: v4hook }),
              truncate: true,
              icon: <DocumentList color="$neutral2" size={16} />,
              onPress: () => setShowHookDetails(true),
            }
          : {
              label: v4hook,
              tooltipContent: t('liquidity.hooks.address.tooltip', { address: v4hook }),
              copyable: true,
              icon: <DocumentList color="$neutral2" size={16} />,
            }
        : undefined,
      feeTierLabel,
      cta,
    ].filter(Boolean) as BadgeData[]
  }, [version, v4hook, hookEntry, feeTier, protocolFeePips, feeBreakdownOverride, cta, t, isFeeDisplayEnabled])

  return (
    <>
      {badges.map((badge, index) => {
        const { label, copyable, icon, iconAfter, tooltipContent } = badge
        const displayLabel = isEVMAddress(label) ? shortenAddress({ address: label }) : label
        const key = label + index
        const content = (
          <PositionInfoBadge
            gap="$spacing4"
            cursor={copyable || badge.onPress ? 'pointer' : 'unset'}
            color={badge.onPress ? '$neutral1' : '$neutral2'}
            placement={getPlacement(index, badges.length)}
            size={size}
            onPress={
              badge.onPress
                ? (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    badge.onPress?.()
                  }
                : undefined
            }
          >
            {icon}
            {copyable ? (
              <CopyHelper toCopy={label} iconSize={12} iconPosition="right">
                <Text variant={size === 'small' ? 'body4' : 'body3'} color="$neutral2">
                  {displayLabel}
                </Text>
              </CopyHelper>
            ) : (
              // FeeDisplay is a transparent wrapper without a breakdown: only the fee badge carries
              // one (flag on), so only it gains the hover breakdown — every other badge renders plain.
              <FeeDisplay feeBreakdown={badge.feeBreakdown}>
                <Text
                  variant={size === 'small' ? 'body4' : 'body3'}
                  color={badge.onPress ? '$neutral1' : '$neutral2'}
                  {...(badge.truncate && {
                    maxWidth: 160,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  })}
                >
                  {displayLabel}
                </Text>
              </FeeDisplay>
            )}
            {iconAfter}
          </PositionInfoBadge>
        )

        if (!tooltipContent) {
          return <Flex key={key}>{content}</Flex>
        }

        return (
          <Tooltip allowFlip stayInFrame placement="top" key={key}>
            <Tooltip.Trigger>{content}</Tooltip.Trigger>
            <Tooltip.Content maxWidth="fit-content">
              <Tooltip.Arrow />
              <Text variant="body4" color="$neutral2">
                {tooltipContent}
              </Text>
            </Tooltip.Content>
          </Tooltip>
        )
      })}
      {hookEntry && chainId && showHookDetails ? (
        // Portal the dialog to the body: badges can render inside row/header links, and a dialog
        // mounted inside an anchor would nest anchors and bubble clicks into it.
        <Portal>
          <HookDetailsModal hookEntry={hookEntry} chainId={chainId} isOpen onClose={() => setShowHookDetails(false)} />
        </Portal>
      ) : null}
    </>
  )
}

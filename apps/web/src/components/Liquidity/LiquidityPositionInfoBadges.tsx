import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { GraphQLApi } from '@universe/api'
import { FeeData } from 'components/Liquidity/Create/types'
import { isDynamicFeeTier } from 'components/Liquidity/utils/feeTiers'
import { getProtocolVersionLabel } from 'components/Liquidity/utils/protocolVersion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Flex, styled, Text, Tooltip } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'

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
  icon?: JSX.Element
  iconAfter?: JSX.Element
  onPress?: () => void
}

interface BadgeCta extends BadgeData {
  onPress: () => void
}

export function LiquidityPositionInfoBadges({
  version,
  v4hook,
  feeTier,
  size = 'default',
  cta,
}: {
  version?: RestProtocolVersion | GraphQLApi.ProtocolVersion | string
  v4hook?: string
  feeTier?: FeeData
  size: 'small' | 'default'
  cta?: BadgeCta
}): JSX.Element {
  const { t } = useTranslation()

  const badges = useMemo(() => {
    const versionLabel = version
      ? typeof version === 'string'
        ? version.toLowerCase()
        : getProtocolVersionLabel(version)
      : undefined

    const isV2 = versionLabel === 'v2'
    const feeTierLabel = feeTier
      ? isDynamicFeeTier(feeTier)
        ? { label: t('common.dynamic') }
        : { label: `${feeTier.feeAmount / BIPS_BASE}%` }
      : isV2
        ? { label: `${V2_DEFAULT_FEE_TIER / BIPS_BASE}%` }
        : undefined

    return [
      versionLabel ? { label: versionLabel } : undefined,
      v4hook && v4hook !== ZERO_ADDRESS
        ? {
            label: v4hook,
            tooltipContent: t('liquidity.hooks.address.tooltip', { address: v4hook }),
            copyable: true,
            icon: <DocumentList color="$neutral2" size={16} />,
          }
        : undefined,
      feeTierLabel,
      cta,
    ].filter(Boolean) as BadgeData[]
  }, [version, v4hook, feeTier, cta, t])

  return (
    <>
      {badges.map((badge, index) => {
        const { label, copyable, icon, iconAfter, tooltipContent } = badge
        const displayLabel = isEVMAddress(label) ? shortenAddress({ address: label }) : label
        const key = label + index
        const content = (
          <PositionInfoBadge
            cursor={copyable || badge.onPress ? 'pointer' : 'unset'}
            color={badge.onPress ? '$neutral1' : '$neutral2'}
            placement={getPlacement(index, badges.length)}
            size={size}
            onPress={
              badge.onPress
                ? (e) => {
                    e.preventDefault()
                    badge.onPress?.()
                  }
                : undefined
            }
          >
            {icon}
            {copyable ? (
              <CopyHelper toCopy={label} iconSize={12} iconPosition="right">
                {displayLabel}
              </CopyHelper>
            ) : (
              displayLabel
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
    </>
  )
}

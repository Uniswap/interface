import { FeeAmount } from '@uniswap/v3-sdk'
import { isDynamicFeeTierAmount } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { styled, Text } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { isAddress, shortenAddress } from 'utilities/src/addresses'

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
  copyable?: boolean
  icon?: JSX.Element
}

export function LiquidityPositionInfoBadges({
  versionLabel,
  v4hook,
  feeTier,
  size = 'default',
}: {
  versionLabel?: string
  v4hook?: string
  feeTier?: string | FeeAmount
  size: 'small' | 'default'
}): JSX.Element {
  const { t } = useTranslation()

  const badges = useMemo(() => {
    return [
      versionLabel ? { label: versionLabel } : undefined,
      v4hook && v4hook !== ZERO_ADDRESS
        ? { label: v4hook, copyable: true, icon: <DocumentList color="$neutral2" size={16} /> }
        : undefined,
      feeTier !== undefined && feeTier !== '' && (typeof feeTier === 'number' || !isNaN(Number(feeTier)))
        ? isDynamicFeeTierAmount(feeTier)
          ? { label: t('common.dynamic') }
          : { label: `${Number(feeTier) / 10000}%` }
        : undefined,
    ].filter(Boolean) as BadgeData[]
  }, [versionLabel, v4hook, feeTier, t])

  return (
    <>
      {badges.map(({ label, copyable, icon }, index) => {
        const displayLabel = isAddress(label) ? shortenAddress(label) : label
        return (
          <PositionInfoBadge
            cursor={copyable ? 'pointer' : 'unset'}
            key={label + index}
            placement={getPlacement(index, badges.length)}
            size={size}
          >
            {icon}
            {copyable ? (
              <CopyHelper toCopy={label} iconSize={12} iconPosition="right">
                {displayLabel}
              </CopyHelper>
            ) : (
              displayLabel
            )}
          </PositionInfoBadge>
        )
      })}
    </>
  )
}

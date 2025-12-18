import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, Tooltip } from 'ui/src'
import { DotLine } from 'ui/src/components/icons/DotLine'
import { zIndexes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { currencyId, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import type { RoutingDiagramEntry, RoutingHop } from 'uniswap/src/utils/routingDiagram/types'

const PoolBadge = styled(Flex, {
  row: true,
  centered: true,
  p: '$spacing8',
})

const OpaqueBadge = styled(PoolBadge, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded8',
  justifyContent: 'flex-start',
  p: '$spacing4',
  zIndex: zIndexes.sticky,
  '$platform-web': {
    display: 'grid',
    gridGap: '$spacing4',
    gridAutoFlow: 'column',
  },
})

const BadgeText = styled(Text, {
  variant: 'body4',
  '$platform-web': {
    wordBreak: 'normal',
  },
})

function useHopBadgeContent({ hop, tokenPair }: { hop: RoutingHop; tokenPair: string }): {
  badgeText: string
  tooltipText: string
} {
  const { t } = useTranslation()

  // Disabling this rule so that it elint warns us when we add a new hop type and it's properly handled.
  // eslint-disable-next-line consistent-return
  return useMemo(() => {
    switch (hop.type) {
      case 'uniswapPool': {
        const feePercent = hop.fee / BIPS_BASE
        const poolFeeText = hop.isDynamic ? t('pool.dynamic') : t('pool.percent', { pct: feePercent })

        return {
          badgeText: hop.isDynamic ? t('common.dynamic') : `${feePercent}%`,
          tooltipText: `${tokenPair} ${poolFeeText}`,
        }
      }

      case 'genericHop': {
        return {
          badgeText: hop.name,
          tooltipText: t('pool.via', { tokenPair, dex: hop.name }),
        }
      }
    }
  }, [hop, tokenPair, t])
}

function HopBadge({ hop }: { hop: RoutingHop }): JSX.Element {
  const priceUXEnabled = usePriceUXEnabled()
  const inputCurrencyInfo = useCurrencyInfo(hop.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(hop.outputCurrencyId)

  const inputSymbol = inputCurrencyInfo?.currency.symbol ?? '-'
  const outputSymbol = outputCurrencyInfo?.currency.symbol ?? '-'
  const tokenPair = `${inputSymbol}/${outputSymbol}`

  const chainId = inputCurrencyInfo?.currency.chainId ?? currencyIdToChain(hop.inputCurrencyId)

  const { badgeText, tooltipText } = useHopBadgeContent({ hop, tokenPair })

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger cursor="default">
        <OpaqueBadge>
          <Flex ml={2}>
            <SplitLogo
              chainId={chainId}
              inputCurrencyInfo={inputCurrencyInfo}
              outputCurrencyInfo={outputCurrencyInfo}
              size={priceUXEnabled ? 12 : 20}
            />
          </Flex>
          <BadgeText>{badgeText}</BadgeText>
        </OpaqueBadge>
      </Tooltip.Trigger>
      <Tooltip.Content zIndex={zIndexes.overlay}>
        <Text variant="body4">{tooltipText}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}

export function RoutingDiagram({
  currencyIn,
  currencyOut,
  routes,
}: {
  currencyIn: Currency
  currencyOut: Currency
  routes: RoutingDiagramEntry[]
}): JSX.Element {
  const currencyInCurrencyInfo = useCurrencyInfo(currencyId(currencyIn))
  const currencyOutCurrencyInfo = useCurrencyInfo(currencyId(currencyOut))

  return (
    <Flex>
      {routes.map((entry, index) => (
        <RouteRow
          key={index}
          entry={entry}
          currencyInCurrencyInfo={currencyInCurrencyInfo}
          currencyOutCurrencyInfo={currencyOutCurrencyInfo}
        />
      ))}
    </Flex>
  )
}

function RouteRow({
  entry,
  currencyInCurrencyInfo,
  currencyOutCurrencyInfo,
}: {
  entry: RoutingDiagramEntry
  currencyInCurrencyInfo: Maybe<CurrencyInfo>
  currencyOutCurrencyInfo: Maybe<CurrencyInfo>
}): JSX.Element {
  const priceUXEnabled = usePriceUXEnabled()
  const { path } = entry

  // If we only have 2 or fewer pools, show everything in one row
  if (path.length <= 2) {
    return (
      <Flex row alignItems="center" gap="$spacing4">
        <CurrencyLogo currencyInfo={currencyInCurrencyInfo} size={priceUXEnabled ? 12 : 20} />
        <Route entry={entry} />
        <CurrencyLogo currencyInfo={currencyOutCurrencyInfo} size={priceUXEnabled ? 12 : 20} />
      </Flex>
    )
  }

  // For more than 2 pools, use a two-line layout
  return (
    <Flex width="100%" gap="$spacing4">
      {/* First line: currencyIn icon, first 2 pools */}
      <Flex row alignItems="center" width="100%" gap="$spacing4">
        <Flex ml="$spacing4">
          <CurrencyLogo currencyInfo={currencyInCurrencyInfo} size={priceUXEnabled ? 12 : 20} />
        </Flex>
        <Flex flex={1}>
          <Route entry={{ ...entry, path: path.slice(0, 2) }} />
        </Flex>
      </Flex>

      {/* Second line: remaining pools, currencyOut icon */}
      <Flex row alignItems="center" width="100%" gap="$spacing4">
        <Flex ml="$spacing4" flex={1}>
          <Route entry={{ ...entry, path: path.slice(2) }} showBadge={false} />
        </Flex>
        <Flex mr="$spacing4">
          <CurrencyLogo currencyInfo={currencyOutCurrencyInfo} size={priceUXEnabled ? 12 : 20} />
        </Flex>
      </Flex>
    </Flex>
  )
}

function Route({ entry, showBadge = true }: { entry: RoutingDiagramEntry; showBadge?: boolean }): JSX.Element {
  return (
    <Flex row justifyContent="space-evenly" flex={1} position="relative" width="auto" py="$spacing4">
      <Flex
        alignItems="center"
        position="absolute"
        width="100%"
        height="100%"
        left={0}
        top={0}
        zIndex={1}
        opacity={0.5}
      >
        <DotLine minWidth="100%" minHeight={35} />
      </Flex>

      {showBadge && (
        <OpaqueBadge>
          <BadgeText>{entry.protocolLabel}</BadgeText>
          <BadgeText style={{ minWidth: 'auto' }}>{entry.percent.toSignificant(2)}%</BadgeText>
        </OpaqueBadge>
      )}

      <Flex row gap="$spacing4" width="auto" zIndex={2} flex={1} justifyContent="space-evenly" alignItems="center">
        {entry.path.map((hop, index) => (
          <HopBadge key={index} hop={hop} />
        ))}
      </Flex>
    </Flex>
  )
}

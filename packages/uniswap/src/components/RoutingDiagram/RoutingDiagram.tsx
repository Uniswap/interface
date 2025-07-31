import { Protocol } from '@uniswap/router-sdk'
import { Currency } from '@uniswap/sdk-core'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, styled as tamaguiStyled } from 'ui/src'
import { DotLine } from 'ui/src/components/icons/DotLine'
import { zIndexes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { RoutingDiagramEntry } from 'uniswap/src/utils/getRoutingDiagramEntries'

const PoolBadge = tamaguiStyled(Flex, {
  row: true,
  centered: true,
  p: '$spacing8',
})

const OpaqueBadge = tamaguiStyled(PoolBadge, {
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

const BadgeText = tamaguiStyled(Text, {
  variant: 'body4',
  '$platform-web': {
    wordBreak: 'normal',
  },
})

const currencyToCurrencyId = (currency: Currency): string => {
  return 'address' in currency
    ? buildCurrencyId(currency.chainId, currency.address)
    : buildNativeCurrencyId(currency.chainId)
}

function Pool({
  currency0,
  currency1,
  feeAmount,
}: {
  currency0: Currency
  currency1: Currency
  feeAmount: number
}): JSX.Element {
  const { t } = useTranslation()
  const priceUXEnabled = usePriceUXEnabled()
  const currency0CurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currency0))
  const currency1CurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currency1))
  const isDynamicFee = feeAmount === DYNAMIC_FEE_AMOUNT

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>
        <OpaqueBadge>
          <Flex ml={2}>
            <SplitLogo
              chainId={currency0.chainId}
              inputCurrencyInfo={currency0CurrencyInfo}
              outputCurrencyInfo={currency1CurrencyInfo}
              size={priceUXEnabled ? 12 : 20}
            />
          </Flex>
          {isDynamicFee ? <BadgeText>{t('common.dynamic')}</BadgeText> : <BadgeText>{feeAmount}%</BadgeText>}
        </OpaqueBadge>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4">
          <Trans
            i18nKey="pool.percent"
            values={{ pct: currency0.symbol + '/' + currency1.symbol + ' ' + feeAmount / 10000 }}
          />
        </Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}

export default function RoutingDiagram({
  currencyIn,
  currencyOut,
  routes,
}: {
  currencyIn: Currency
  currencyOut: Currency
  routes: RoutingDiagramEntry[]
}): JSX.Element {
  const currencyInCurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currencyIn))
  const currencyOutCurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currencyOut))

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

function Route({
  entry: { percent, path, protocol },
  showBadge = true,
}: {
  entry: RoutingDiagramEntry
  showBadge?: boolean
}): JSX.Element {
  const badgeText =
    protocol === Protocol.MIXED
      ? [...new Set(path.map(([, , , p]) => p.toUpperCase()))].sort().join(' + ')
      : protocol.toUpperCase()

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
          <BadgeText>{badgeText}</BadgeText>
          <BadgeText style={{ minWidth: 'auto' }}>{percent.toSignificant(2)}%</BadgeText>
        </OpaqueBadge>
      )}

      <Flex row gap="$spacing4" width="auto" zIndex={2} flex={1} justifyContent="space-evenly" alignItems="center">
        {path.map(([currency0, currency1, feeAmount], index) => (
          <Pool key={index} currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
        ))}
      </Flex>
    </Flex>
  )
}

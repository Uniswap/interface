import { Protocol } from '@uniswap/router-sdk'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Flex, Text, Tooltip, styled as tamaguiStyled } from 'ui/src'
import { DotLine } from 'ui/src/components/icons/DotLine'
import { zIndices } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { Trans } from 'uniswap/src/i18n'
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
  zIndex: zIndices.sticky,
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
  feeAmount: FeeAmount
}): JSX.Element {
  const currency0CurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currency0))
  const currency1CurrencyInfo = useCurrencyInfo(currencyToCurrencyId(currency1))

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>
        <OpaqueBadge>
          <Flex mr={4} ml={12}>
            <SplitLogo
              chainId={currency0.chainId}
              inputCurrencyInfo={currency0CurrencyInfo}
              outputCurrencyInfo={currency1CurrencyInfo}
              size={20}
            />
          </Flex>
          <BadgeText>{feeAmount / BIPS_BASE}%</BadgeText>
        </OpaqueBadge>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4">
          <Trans
            i18nKey="pool.percent"
            values={{ pct: currency0?.symbol + '/' + currency1?.symbol + ' ' + feeAmount / 10000 }}
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
        <Flex key={index} alignItems="center" style={{ display: 'grid', gridTemplateColumns: '24px 1fr 24px' }}>
          <CurrencyLogo currencyInfo={currencyInCurrencyInfo} size={20} />
          <Route entry={entry} />
          <CurrencyLogo currencyInfo={currencyOutCurrencyInfo} size={20} />
        </Flex>
      ))}
    </Flex>
  )
}

function Route({ entry: { percent, path, protocol } }: { entry: RoutingDiagramEntry }): JSX.Element {
  const badgeText =
    protocol === Protocol.MIXED
      ? [...new Set(path.map(([, , , p]) => p.toUpperCase()))].sort().join(' + ') // extract all protocols involved in mixed path
      : protocol.toUpperCase()

  return (
    <Flex row centered style={{ padding: '0.1rem 0.5rem' }} width="100%">
      <Flex alignItems="center" position="absolute" width="100%" zIndex={1} opacity={0.5}>
        <DotLine minWidth="100%" minHeight={35} />
      </Flex>
      <OpaqueBadge>
        <BadgeText>{badgeText}</BadgeText>
        <BadgeText style={{ minWidth: 'auto' }}>{percent.toSignificant(2)}%</BadgeText>
      </OpaqueBadge>
      <Flex row flexWrap="wrap" m={-32} gap={1} width="100%" style={{ justifyContent: 'space-evenly', zIndex: 2 }}>
        {path.map(([currency0, currency1, feeAmount], index) => (
          <Pool key={index} currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
        ))}
      </Flex>
    </Flex>
  )
}

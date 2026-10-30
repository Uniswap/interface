import { Flex, ScrollView, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, ModalCloseIcon, Separator } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginPairGroup } from '~/constants/margin'
import { MarginSideToggle } from '~/pages/Swap/Margin/components/MarginSideToggle'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import {
  getMarginCurrencyInfo,
  getMarginPairLogoProps,
  useMarginCurrencyInfos,
} from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import {
  formatBorrowRate,
  formatMaxLeverage,
  getMarginDirectionStyle,
  lltvToPercent,
  marginVenueLabel,
} from '~/pages/Swap/Margin/marginFormat'
import { getMarginLeverageCap } from '~/pages/Swap/Margin/marginOpenButtonGate'
import {
  marginMarketDirection,
  marginPairGroupLabel,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapName,
  marginUnwrapSymbol,
} from '~/pages/Swap/Margin/marginTokenDisplay'

const MAX_LEV_COL_WIDTH = 56
const BORROW_COL_WIDTH = 80
const VENUES_COL_WIDTH = 76
const LIST_MAX_HEIGHT = 420

// The venues a row may advertise: the pair's venues minus the user's global opt-outs, which is the
// set the slider ceiling and the quote will actually use. Falls back to the unfiltered list when the
// opt-outs would empty it, so the row still says something rather than rendering "— / — / 0" (the
// form's own empty-venue notice owns that state).
function allowedPairs(group: MarginPairGroup, excludedVenues: MarginVenue[]): MarginPairGroup['pairs'] {
  const allowed = group.pairs.filter((pair) => !excludedVenues.includes(pair.venue))
  return allowed.length > 0 ? allowed : group.pairs
}

// Headline leverage for a pair group comes from its highest-leverage venue — the same client max()
// the slider ceiling uses, over the same server-authored caps. Absent until the row's venues carry
// one; the wire is the only source (deriving from lltv is forbidden).
function groupMaxLeverage(pairs: MarginPairGroup['pairs']): number | undefined {
  return getMarginLeverageCap({ markets: pairs })
}

// Cheapest borrow across a pair's venues. Undefined when no venue reported a rate, so the row shows
// an em dash rather than the "Infinity%" a bare Math.min over an empty list would format to.
function groupLowestBorrowRateBps(pairs: MarginPairGroup['pairs']): number | undefined {
  const rates = pairs.map((pair) => pair.borrowRateBps).filter((rate): rate is number => rate !== undefined)
  return rates.length > 0 ? Math.min(...rates) : undefined
}

// Display name of the traded leg, e.g. "Ethereum" for an ETH/USDC pair in either direction.
function pairGroupBaseName({
  group,
  currencyInfos,
}: {
  group: MarginPairGroup
  currencyInfos: Map<string, CurrencyInfo>
}): string {
  const info = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(group.base) })
  return marginUnwrapName({ address: group.base.address, name: info?.currency.name ?? group.base.symbol })
}

// Whitespace- and slash-insensitive form, so "eth/usdc", "eth / usdc" and "ethusdc" all match.
function compactPairText(value: string): string {
  return value.replace(/[\s/]/g, '').toLowerCase()
}

// Collapsed pair header: dual token icons, "<base> / <quote>", a Long/Short badge, the venue +
// LLTV, and a chevron. Tapping it opens the selector modal.
function PairHeaderButton({
  onPress,
  currencyInfos,
}: {
  onPress: () => void
  currencyInfos: Map<string, CurrencyInfo>
}): JSX.Element | null {
  const { t } = useTranslation()
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { getPairMarket, markets } = useMarginMarkets()
  const market = getPairMarket(pairKey) ?? markets.at(0)

  // MarginFormMarketsState owns the loading / error / empty surface — it renders directly below this
  // in MarginForm's else-branch, with the same copy, the same testIDs and its own retry. Rendering a
  // second copy here stacked two identical boxes with two Retry buttons on any markets failure.
  if (!market) {
    return null
  }
  // Ground truth is the resolved market's own direction — never the raw side toggle, which can
  // diverge from what's actually selected.
  const direction =
    market.direction ??
    marginMarketDirection({
      collateralToken: market.collateral.address,
      debtToken: market.debt.address,
    })
  const directionStyle = getMarginDirectionStyle(direction)

  return (
    <TouchableArea
      borderRadius="$rounded20"
      borderWidth={1}
      borderColor="$surface3"
      p="$spacing16"
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <SplitLogo
          size={40}
          chainId={MARGIN_CHAIN_ID}
          inputCurrencyInfo={null}
          outputCurrencyInfo={null}
          {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
        />
        <Flex fill gap="$spacing2">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="body1" color="$neutral1">
              {marginPairLabel({ market })}
            </Text>
            <Flex
              px="$spacing8"
              py="$spacing2"
              borderRadius="$roundedFull"
              backgroundColor={directionStyle.backgroundColor}
            >
              <Text variant="buttonLabel4" color={directionStyle.color}>
                {direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')}
              </Text>
            </Flex>
          </Flex>
          <Flex row alignItems="center" gap="$spacing6">
            <MarginVenueLogo venue={market.venue} size="$icon.16" />
            <Text variant="body4" color="$neutral2">
              {market.lltvWad !== '0'
                ? t('margin.market.venueLltv', {
                    venue: marginVenueLabel(market.venue),
                    lltv: lltvToPercent(market.lltvWad).toFixed(0),
                  })
                : marginVenueLabel(market.venue)}
            </Text>
          </Flex>
        </Flex>
        <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
      </Flex>
    </TouchableArea>
  )
}

function SearchField({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      px="$spacing16"
      minHeight={48}
      borderRadius="$rounded16"
      backgroundColor="$surface2"
      borderWidth={1}
      borderColor="$surface3"
    >
      <Search color="$neutral2" size="$icon.20" />
      <Input
        flex={1}
        value={value}
        placeholder={t('tokens.selector.search.placeholder')}
        placeholderTextColor="$neutral3"
        aria-label={t('margin.selector.searchLabel')}
        autoCapitalize="none"
        autoCorrect={false}
        color="$neutral1"
        backgroundColor="$transparent"
        borderWidth={0}
        fontFamily="$body"
        height="100%"
        px="$none"
        onChangeText={onChangeText}
      />
    </Flex>
  )
}

function ColumnHeader(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" px="$spacing12" gap="$spacing8">
      <Flex fill>
        <Text variant="body4" color="$neutral2">
          {t('margin.selector.columnMarket')}
        </Text>
      </Flex>
      <Text width={MAX_LEV_COL_WIDTH} textAlign="right" variant="body4" color="$neutral2">
        {t('margin.selector.columnMaxLeverage')}
      </Text>
      <Text width={BORROW_COL_WIDTH} textAlign="right" variant="body4" color="$neutral2">
        {t('margin.selector.columnBorrowRate')}
      </Text>
      <Text width={VENUES_COL_WIDTH} textAlign="right" variant="body4" color="$neutral2">
        {t('margin.selector.columnVenues')}
      </Text>
    </Flex>
  )
}

// One row per selectable pair: the traded token's name over "<base> / <quote>", then the best
// leverage, cheapest borrow rate and venue count across the pair's venues.
function PairGroupRow({
  group,
  currencyInfos,
  onSelect,
}: {
  group: MarginPairGroup
  currencyInfos: Map<string, CurrencyInfo>
  onSelect: (group: MarginPairGroup) => void
}): JSX.Element {
  const { t } = useTranslation()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  // Counted over the venues the form would actually use — an excluded venue's leverage and rate must
  // not be advertised on a row whose slider will not offer them.
  const pairs = useMemo(() => allowedPairs(group, excludedVenues), [group, excludedVenues])
  const onPress = useEvent(() => onSelect(group))
  return (
    <TouchableArea
      testID={TestID.MarginPairRow}
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onPress}
    >
      <Flex row alignItems="center" px="$spacing12" py="$spacing12" gap="$spacing8">
        <Flex row alignItems="center" gap="$spacing12" fill>
          <SplitLogo
            size={36}
            chainId={MARGIN_CHAIN_ID}
            inputCurrencyInfo={null}
            outputCurrencyInfo={null}
            {...getMarginPairLogoProps({ base: group.base, quote: group.quote, currencyInfos })}
          />
          <Flex shrink>
            <Text variant="body2" color="$neutral1" numberOfLines={1}>
              {pairGroupBaseName({ group, currencyInfos })}
            </Text>
            <Text variant="body4" color="$neutral2">
              {marginPairGroupLabel({ group })}
            </Text>
          </Flex>
        </Flex>
        <Text width={MAX_LEV_COL_WIDTH} textAlign="right" variant="body3" color="$neutral1">
          {formatMaxLeverage(groupMaxLeverage(pairs))}
        </Text>
        <Text width={BORROW_COL_WIDTH} textAlign="right" variant="body3" color="$neutral1">
          {formatBorrowRate(groupLowestBorrowRateBps(pairs))}
        </Text>
        <Text width={VENUES_COL_WIDTH} textAlign="right" variant="body3" color="$neutral2">
          {t('margin.selector.venuesCount', { count: pairs.length })}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export function MarginMarketSelector(): JSX.Element {
  const { t } = useTranslation()
  const { setMarginFormState } = useMarginFormStoreActions()
  const side = useMarginFormStore((s) => s.side)

  const currencyInfos = useMarginCurrencyInfos()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { groups, isLoading } = useMarginMarkets()
  const filteredGroups = useMemo(() => {
    const bySide = groups.filter((group) => group.direction === side)
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return bySide
    }
    const compactQuery = compactPairText(normalized)
    // Raw symbols alongside unwrapped ones, so "weth" still finds the ETH pair.
    return bySide.filter(
      (group) =>
        group.base.symbol.toLowerCase().includes(normalized) ||
        group.quote.symbol.toLowerCase().includes(normalized) ||
        marginUnwrapSymbol(group.base).toLowerCase().includes(normalized) ||
        marginUnwrapSymbol(group.quote).toLowerCase().includes(normalized) ||
        pairGroupBaseName({ group, currencyInfos }).toLowerCase().includes(normalized) ||
        compactPairText(marginPairGroupLabel({ group })).includes(compactQuery),
    )
  }, [groups, query, side, currencyInfos])

  const emptyCopy = query.trim()
    ? t('margin.selector.empty')
    : side === MarginDirection.SHORT
      ? t('margin.selector.emptySideShort')
      : t('margin.selector.emptySideLong')

  const openModal = useEvent(() => {
    setQuery('')
    setIsOpen(true)
  })
  const closeModal = useEvent(() => setIsOpen(false))

  // One step: picking a row adopts the pair outright. The venue is deliberately not pinned — the
  // server routes over the allowlist, and the user's venue preference lives in `excludedVenues`.
  const onSelectGroup = useEvent((group: MarginPairGroup) => {
    // Clear any explicit payment selection so the new market's default re-resolves.
    setMarginFormState({
      pairKey: group.pairKey,
      paymentToken: undefined,
      side: group.direction,
    })
    setIsOpen(false)
  })

  return (
    <>
      <PairHeaderButton onPress={openModal} currencyInfos={currencyInfos} />
      <Modal name={ModalName.MarginMarketSelector} isModalOpen={isOpen} maxWidth={480} padding={0} onClose={closeModal}>
        <Flex p="$spacing16" gap="$spacing16">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="subheading1" color="$neutral1">
              {t('margin.selector.title')}
            </Text>
            <ModalCloseIcon onClose={closeModal} />
          </Flex>
          <MarginSideToggle />
          <SearchField value={query} onChangeText={setQuery} />
          <ColumnHeader />
          <ScrollView maxHeight={LIST_MAX_HEIGHT} showsVerticalScrollIndicator={false}>
            <Flex>
              {filteredGroups.map((group, index) => (
                <Flex key={group.key}>
                  {index > 0 ? <Separator /> : null}
                  <PairGroupRow group={group} currencyInfos={currencyInfos} onSelect={onSelectGroup} />
                </Flex>
              ))}
              {filteredGroups.length === 0 ? (
                <Flex
                  p="$spacing16"
                  alignItems="center"
                  testID={isLoading ? TestID.MarginMarketsLoading : TestID.MarginMarketsEmpty}
                >
                  <Text variant="body3" color="$neutral2">
                    {isLoading ? t('common.loading') : emptyCopy}
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          </ScrollView>
        </Flex>
      </Modal>
    </>
  )
}

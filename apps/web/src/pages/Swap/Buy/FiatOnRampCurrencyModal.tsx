import {
  Flex,
  iconSizes,
  ModalCloseIcon,
  Text,
  UniversalList,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import { GraduationCap } from '@universe/mycelium/icons/GraduationCap'
import { useIsDarkMode, useMedia, useScrollbarStyles } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { SNAP_POINTS } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyRow } from '~/components/SearchModal/CurrencyList'
import { DropdownController } from '~/features/Swap/DropdownController'
import { useBuyFormContext } from '~/pages/Swap/Buy/BuyFormContext'
import { HeaderContent } from '~/pages/Swap/Buy/CountryListModal'
import { ContentWrapper } from '~/pages/Swap/Buy/shared'

const ROW_ITEM_SIZE = 56

enum FiatOnRampCurrencyRowType {
  Info = 'info',
  UnsupportedToggle = 'unsupportedToggle',
  Currency = 'currency',
}

type FiatOnRampCurrencyRow =
  | { type: FiatOnRampCurrencyRowType.Info; key: string }
  | { type: FiatOnRampCurrencyRowType.UnsupportedToggle; key: string }
  | {
      type: FiatOnRampCurrencyRowType.Currency
      key: string
      currency: FiatOnRampCurrency
      currencyInfo: CurrencyInfo
      isSupported: boolean
    }

function rowKey(row: FiatOnRampCurrencyRow): string {
  return row.key
}

/**
 * `meldCurrencyCode` identifies the FOR-supported currencies, but the unsupported ones are built
 * from portfolio balances (`BuyForm.tsx`: `({ currencyInfo: balancesById[id].currencyInfo })`) and
 * carry no code at all — so they need the currency id instead, or every one of them keys the same.
 * Prefixed by group because a currency can legitimately appear in both lists.
 */
function currencyRowKey(prefix: string, currency: FiatOnRampCurrency): string {
  return `${prefix}-${currency.meldCurrencyCode ?? currency.currencyInfo?.currencyId}`
}

/**
 * A currency the data layer couldn't resolve has nothing to render, so it never becomes a row —
 * otherwise the list sizes a slot for it and leaves a blank gap. Dropping them here also keeps the
 * unsupported toggle counting only rows that will actually appear beneath it.
 */
function toCurrencyRows({
  prefix,
  currencies,
  isSupported,
}: {
  prefix: string
  currencies: FiatOnRampCurrency[]
  isSupported: boolean
}): FiatOnRampCurrencyRow[] {
  const rows: FiatOnRampCurrencyRow[] = []
  for (const currency of currencies) {
    const { currencyInfo } = currency
    if (!currencyInfo) {
      continue
    }
    rows.push({
      type: FiatOnRampCurrencyRowType.Currency,
      key: currencyRowKey(prefix, currency),
      currency,
      currencyInfo,
      isSupported,
    })
  }
  return rows
}

function rowType(row: FiatOnRampCurrencyRow): FiatOnRampCurrencyRowType {
  return row.type
}

/**
 * Resolves its own label: the toggle row object only rebuilds when `expanded` or the currency lists
 * change, so a parent-resolved string would keep the previous language after a locale switch.
 */
function UnsupportedCurrenciesToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation()

  return (
    <DropdownController open={expanded} onClick={onToggle}>
      {t('fiatOffRamp.unsupportedToken.divider')}
    </DropdownController>
  )
}

function FiatOnRampInfo() {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      row
      justifyContent="space-between"
      mx="$spacing16"
      p="$spacing12"
      gap="$spacing12"
      backgroundColor={isDarkMode ? '$cyanDark' : '$cyanLight'}
      borderRadius="$rounded12"
    >
      <Flex>
        <GraduationCap size={iconSizes.icon20} color="$cyanBase" />
      </Flex>
      <Flex gap="$spacing2" flexShrink={1}>
        <Text variant="body3" color="$neutral1">
          {t('fiatOnRamp.buy.info.title')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('fiatOnRamp.buy.info.description')}
        </Text>
      </Flex>
    </Flex>
  )
}

interface FiatOnRampCurrencyModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  selectedCurrency?: FiatOnRampCurrency
  currencies: FiatOnRampCurrency[]
  unsupportedCurrencies: FiatOnRampCurrency[]
}

export function FiatOnRampCurrencyModal({
  isOpen,
  onDismiss,
  currencies,
  unsupportedCurrencies,
  selectedCurrency,
  onSelectCurrency,
}: FiatOnRampCurrencyModalProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()
  const { setBuyFormState } = useBuyFormContext()
  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()

  const [expanded, setExpanded] = useState(true)
  const toggleExpanded = useCallback(() => setExpanded((current) => !current), [])

  const rows = useMemo<FiatOnRampCurrencyRow[]>(() => {
    const result: FiatOnRampCurrencyRow[] = []

    if (isWebFORNudgeEnabled) {
      result.push({ type: FiatOnRampCurrencyRowType.Info, key: 'for-info' })
    }

    result.push(...toCurrencyRows({ prefix: 'supported', currencies, isSupported: true }))

    const unsupportedRows = toCurrencyRows({
      prefix: 'unsupported',
      currencies: unsupportedCurrencies,
      isSupported: false,
    })
    if (unsupportedRows.length > 0) {
      result.push({ type: FiatOnRampCurrencyRowType.UnsupportedToggle, key: 'unsupported-toggle' })

      if (expanded) {
        result.push(...unsupportedRows)
      }
    }

    return result
  }, [currencies, unsupportedCurrencies, expanded, isWebFORNudgeEnabled])

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<FiatOnRampCurrencyRow>): JSX.Element | null => {
      switch (item.type) {
        case FiatOnRampCurrencyRowType.Info:
          return <FiatOnRampInfo />
        case FiatOnRampCurrencyRowType.UnsupportedToggle:
          return <UnsupportedCurrenciesToggle expanded={expanded} onToggle={toggleExpanded} />
        case FiatOnRampCurrencyRowType.Currency:
          return (
            <CurrencyRow
              // `RowWrapper` defaults to 60; these rows render at 56.
              style={{ height: ROW_ITEM_SIZE }}
              currencyInfo={item.currencyInfo}
              showUsdValue
              showCurrencyAmount
              onSelect={() => {
                if (item.isSupported) {
                  onSelectCurrency(item.currency)
                  onDismiss()
                } else {
                  setBuyFormState((state) => ({ ...state, selectedUnsupportedCurrency: item.currency }))
                }
              }}
              // Unsupported rows carry no meld code, so a bare `===` marks all of them selected
              // whenever nothing is selected yet — reachable when neither token defaulting branch fires.
              isSelected={
                !!selectedCurrency?.meldCurrencyCode &&
                selectedCurrency.meldCurrencyCode === item.currency.meldCurrencyCode
              }
              eventProperties={{}}
              otherSelected={false}
            />
          )
        default: {
          // Defect guard: FiatOnRampCurrencyRow is a closed union.
          const unreachable: never = item
          throw new Error(`unknown fiat on-ramp currency row: ${JSON.stringify(unreachable)}`)
        }
      }
    },
    [expanded, toggleExpanded, onSelectCurrency, onDismiss, setBuyFormState, selectedCurrency?.meldCurrencyCode],
  )

  const listStyle = useMemo<UniversalListStyle>(() => ({ style: scrollbarStyles }), [scrollbarStyles])

  return (
    <Modal
      name={ModalName.FiatOnRampTokenSelector}
      maxWidth={420}
      height={media.sm ? '100vh' : '100%'}
      maxHeight={700}
      // The mobile-web sheet must take its height from the snap point, not content-fit: the
      // virtualized currency list fills its container rather than its content, so it has no intrinsic
      // height, and a fit-mode sheet freezes at chrome height with an empty list. See (SWAP-3250)
      snapPoints={SNAP_POINTS}
      snapPointsMode="percent"
      isModalOpen={isOpen}
      onClose={onDismiss}
      padding={0}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex row justifyContent="space-between">
            <Text variant="subheading1">{t('common.selectToken.label')}</Text>
            <ModalCloseIcon testId="FiatOnRampCurrencyModal-close" onClose={onDismiss} />
          </Flex>
        </HeaderContent>
        {/* Web `fill` is `flex: 1 1 auto`, so without a 0 basis the content height squeezes the header. */}
        <Flex fill flexBasis={0}>
          <UniversalList
            data={rows}
            estimatedItemSize={ROW_ITEM_SIZE}
            // `rows` doesn't change when the selection does, so without this the cells stay memoized
            // and the highlight never moves. Reachable via a wallet-initiated chain switch.
            extraData={selectedCurrency?.meldCurrencyCode}
            getItemType={rowType}
            keyExtractor={rowKey}
            renderItem={renderItem}
            style={listStyle}
            testID="for-currency-list-wrapper"
          />
        </Flex>
      </ContentWrapper>
    </Modal>
  )
}

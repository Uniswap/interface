import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import type { Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { fonts } from 'ui/src/theme'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import {
  commitDraftToFloorPrice,
  draftMirrorsPersisted,
  exceedsDecimalCap,
  getDisplayValueForMode,
  maxDecimalsForDraftInput,
  pickDisplayValueForToggleTarget,
  previewFloorPriceForFdvUsdDraft,
  resolveUnfocusedDraftSync,
  shouldRejectDraftBelowMinimum,
  type FloorPriceDenomination,
  type InputCurrency,
} from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraft'
import {
  FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD,
  useFloorPriceSelectorDisplay,
} from '~/pages/Liquidity/CreateAuction/components/useFloorPriceSelectorDisplay'
import { type FloorPriceInputState, RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'
import { useLocalizedNumberInput } from '~/pages/Liquidity/CreateAuction/utils/localizedNumberInput'

export type FloorPriceSelectorHandle = {
  focus: () => void
}

export function FloorPriceSelector({
  ref,
  chainId,
  floorPrice,
  floorPriceInput,
  raiseCurrency,
  tokenTotalSupply,
  inputCurrency,
  usdPriceNum,
  onInputCurrencyChange,
  onFloorPriceChange,
}: {
  ref?: Ref<FloorPriceSelectorHandle>
  chainId: UniverseChainId
  floorPrice: string
  floorPriceInput: FloorPriceInputState | undefined
  raiseCurrency: RaiseCurrency
  tokenTotalSupply: CurrencyAmount<Currency>
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  onInputCurrencyChange: (next: InputCurrency) => void
  onFloorPriceChange: (value: string, input?: Omit<FloorPriceInputState, 'floorPrice'>) => void
}) {
  const { t } = useTranslation()

  const matchingFloorPriceInput =
    floorPriceInput?.floorPrice === floorPrice && floorPriceInput.inputCurrency === inputCurrency
      ? floorPriceInput
      : undefined
  const persistedInputIsParentControlled =
    matchingFloorPriceInput?.denomination === 'floorPrice' && matchingFloorPriceInput.inputCurrency === 'raise'

  const [isFocused, setIsFocused] = useState(false)
  const [denomination, setDenomination] = useState<FloorPriceDenomination>(
    matchingFloorPriceInput?.denomination ?? 'floorPrice',
  )
  // Local value (dot-normalized); floorPrice+raise reads canonical value from parent `floorPrice`.
  const [localValue, setLocalValue] = useState(
    matchingFloorPriceInput && !persistedInputIsParentControlled ? matchingFloorPriceInput.rawValue : '',
  )
  const prevRaiseCurrencyRef = useRef(raiseCurrency)
  const skipNextDraftCommitRef = useRef(Boolean(matchingFloorPriceInput && !persistedInputIsParentControlled))
  /** True when the user cleared the draft input; avoids treating initial empty draft as "clear canonical floor price". */
  const allowEmptyCanonicalSyncRef = useRef(false)

  const { code: fiatCurrencyCode } = useAppFiatCurrencyInfo()
  const locale = useCurrentLocale()

  const raiseCurrencyObj = useMemo(() => getRaiseCurrencyAsCurrency(raiseCurrency, chainId), [raiseCurrency, chainId])

  const decimalSeparator = useMemo(
    () =>
      Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((p) => p.type === 'decimal')?.value ?? '.',
    [locale],
  )

  // In floorPrice+raise mode the parent's `floorPrice` prop is the direct source of truth.
  const isParentControlled = denomination === 'floorPrice' && inputCurrency === 'raise'

  /** While typing FDV in USD, derive canonical floor from draft so conversions (e.g. ETH FDV) stay in sync before the commit effect runs. */
  const floorPriceForDisplay = useMemo(
    () =>
      previewFloorPriceForFdvUsdDraft({
        isParentControlled,
        floorPrice,
        localValue,
        denomination,
        inputCurrency,
        usdPriceNum,
        tokenTotalSupply,
        raiseCurrency: raiseCurrencyObj,
      }),
    [
      denomination,
      floorPrice,
      inputCurrency,
      isParentControlled,
      localValue,
      raiseCurrencyObj,
      tokenTotalSupply,
      usdPriceNum,
    ],
  )

  const floorPriceNum = parseFloat(floorPriceForDisplay)
  const hasValidFloorPrice = Number.isFinite(floorPriceNum) && floorPriceNum > 0

  const fdvRaiseNum = useMemo(() => {
    if (!hasValidFloorPrice || !raiseCurrencyObj) {
      return null
    }
    const s = getDisplayValueForMode({
      denomination: 'fdv',
      inputCurrency: 'raise',
      floorPrice: floorPriceForDisplay,
      hasValidFloorPrice,
      tokenTotalSupply,
      raiseCurrency: raiseCurrencyObj,
      usdPriceNum: null,
    })
    const n = s ? parseFloat(s) : NaN
    return Number.isFinite(n) ? n : null
  }, [floorPriceForDisplay, hasValidFloorPrice, raiseCurrencyObj, tokenTotalSupply])

  const rawDisplayValue = isParentControlled ? floorPrice : localValue

  const unfocusedNumeric = useMemo(() => {
    const trimmed = rawDisplayValue.trim()
    const n = trimmed ? parseFloat(trimmed) : NaN
    return Number.isFinite(n) ? n : null
  }, [rawDisplayValue])

  const { inputLabel, pillContent, bottomRowContent } = useFloorPriceSelectorDisplay({
    denomination,
    inputCurrency,
    fiatCurrencyCode,
    raiseCurrencySymbol: raiseCurrencyObj?.symbol ?? '',
    usdPriceNum,
    fdvRaiseNum,
    hasValidFloorPrice,
    floorPriceNum,
  })

  // Hydrate draft from props on remount; skip while focused to avoid fighting in-progress typing.
  useLayoutEffect(() => {
    if (isParentControlled || isFocused) {
      return
    }
    if (allowEmptyCanonicalSyncRef.current) {
      return
    }
    if (inputCurrency === 'usd' && usdPriceNum === null) {
      return
    }
    const sync = resolveUnfocusedDraftSync({
      localValue,
      denomination,
      inputCurrency,
      usdPriceNum,
      tokenTotalSupply,
      raiseCurrency: raiseCurrencyObj,
      floorPrice,
      floorPriceInput,
      hasValidFloorPrice,
    })
    if (sync.action === 'restoreSnapshot') {
      skipNextDraftCommitRef.current = true
      setLocalValue(sync.value)
    } else if (sync.action === 'replace') {
      setLocalValue(sync.value)
    }
  }, [
    denomination,
    floorPrice,
    floorPriceInput,
    hasValidFloorPrice,
    inputCurrency,
    isFocused,
    isParentControlled,
    localValue,
    raiseCurrencyObj,
    tokenTotalSupply,
    usdPriceNum,
  ])

  // Hook gives dot-decimal string; apply decimal-cap then write parent or draft.
  const handleRawChange = useCallback(
    (raw: string) => {
      if (!isParentControlled) {
        allowEmptyCanonicalSyncRef.current = raw.trim() === ''
      }
      if (isParentControlled) {
        const maxDecimals = raiseCurrencyObj?.decimals
        if (maxDecimals !== undefined && exceedsDecimalCap(raw, maxDecimals)) {
          return
        }
        if (
          raiseCurrencyObj &&
          shouldRejectDraftBelowMinimum({
            localValue: raw,
            denomination,
            inputCurrency,
            usdPriceNum,
            tokenTotalSupply,
            raiseCurrency: raiseCurrencyObj,
          })
        ) {
          return
        }
        onFloorPriceChange(
          raw,
          raw.trim() !== ''
            ? {
                rawValue: raw,
                denomination,
                inputCurrency,
              }
            : undefined,
        )
        return
      }
      const maxDecimals = maxDecimalsForDraftInput(inputCurrency, raiseCurrencyObj?.decimals)
      if (exceedsDecimalCap(raw, maxDecimals)) {
        return
      }
      if (
        raiseCurrencyObj &&
        shouldRejectDraftBelowMinimum({
          localValue: raw,
          denomination,
          inputCurrency,
          usdPriceNum,
          tokenTotalSupply,
          raiseCurrency: raiseCurrencyObj,
        })
      ) {
        return
      }
      setLocalValue(raw)
    },
    [
      denomination,
      inputCurrency,
      isParentControlled,
      onFloorPriceChange,
      raiseCurrencyObj,
      tokenTotalSupply,
      usdPriceNum,
    ],
  )

  const {
    displayValue: focusedDisplayValue,
    inputRef,
    handleChange,
  } = useLocalizedNumberInput({
    rawValue: rawDisplayValue,
    locale,
    onChangeRaw: handleRawChange,
  })

  // Commit draft to canonical floor on changes; clear draft on raise-currency change; re-run when USD price arrives.
  useEffect(() => {
    const raiseCurrencyChanged = prevRaiseCurrencyRef.current !== raiseCurrency
    prevRaiseCurrencyRef.current = raiseCurrency

    if (raiseCurrencyChanged) {
      setLocalValue('')
    }

    if (isParentControlled) {
      return
    }

    const draftForCommit = raiseCurrencyChanged ? '' : localValue
    if (skipNextDraftCommitRef.current) {
      skipNextDraftCommitRef.current = false
      return
    }
    if (draftMirrorsPersisted({ floorPriceInput, draftForCommit, denomination, inputCurrency, floorPrice })) {
      return
    }
    const next = commitDraftToFloorPrice({
      localValue: draftForCommit,
      denomination,
      inputCurrency,
      usdPriceNum,
      tokenTotalSupply,
      raiseCurrency: raiseCurrencyObj,
    })
    if (next === '' && floorPrice !== '' && !allowEmptyCanonicalSyncRef.current) {
      return
    }
    const nextInput =
      draftForCommit.trim() !== ''
        ? {
            rawValue: draftForCommit,
            denomination,
            inputCurrency,
          }
        : undefined
    if (
      next !== floorPrice ||
      floorPriceInput?.rawValue !== nextInput?.rawValue ||
      floorPriceInput?.denomination !== nextInput?.denomination ||
      floorPriceInput?.inputCurrency !== nextInput?.inputCurrency
    ) {
      onFloorPriceChange(next, nextInput)
    }
  }, [
    denomination,
    floorPrice,
    floorPriceInput,
    inputCurrency,
    isParentControlled,
    localValue,
    onFloorPriceChange,
    raiseCurrency,
    raiseCurrencyObj,
    tokenTotalSupply,
    usdPriceNum,
  ])

  // Toggle: skipNextDraftCommitRef avoids snapshot drift; pickDisplayValueForToggleTarget restores rawValue when it matches.
  const pickToggleDisplay = useCallback(
    (targetDenomination: FloorPriceDenomination, targetInputCurrency: InputCurrency) =>
      pickDisplayValueForToggleTarget({
        targetDenomination,
        targetInputCurrency,
        floorPrice,
        floorPriceInput,
        hasValidFloorPrice,
        tokenTotalSupply,
        raiseCurrency: raiseCurrencyObj,
        usdPriceNum,
      }),
    [floorPrice, floorPriceInput, hasValidFloorPrice, raiseCurrencyObj, tokenTotalSupply, usdPriceNum],
  )

  const toggleDenomination = useCallback(() => {
    const next: FloorPriceDenomination = denomination === 'floorPrice' ? 'fdv' : 'floorPrice'
    skipNextDraftCommitRef.current = true
    setLocalValue(pickToggleDisplay(next, inputCurrency))
    setDenomination(next)
  }, [denomination, inputCurrency, pickToggleDisplay])

  const toggleInputCurrency = useCallback(() => {
    const next: InputCurrency = inputCurrency === 'raise' ? 'usd' : 'raise'
    skipNextDraftCommitRef.current = true
    setLocalValue(pickToggleDisplay(denomination, next))
    onInputCurrencyChange(next)
  }, [inputCurrency, denomination, pickToggleDisplay, onInputCurrencyChange])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        setIsFocused(true)
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      },
    }),
    [inputRef],
  )

  return (
    <Flex
      backgroundColor="$surface2"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing16"
      position="relative"
    >
      <Flex row gap="$spacing8" alignItems="center" justifyContent="space-between" width="100%" minWidth={0}>
        <Text variant="body3" color="$neutral2" flexShrink={1} minWidth={0} alignSelf="flex-start">
          {denomination === 'fdv'
            ? t('toucan.createAuction.step.configureAuction.floorPrice.fdv')
            : t('toucan.createAuction.step.configureAuction.floorPrice.token')}
        </Text>
        <TouchableArea onPress={toggleDenomination} flexShrink={0}>
          <Flex backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing8" py="$spacing6">
            <Flex row alignItems="baseline" gap="$spacing4" flexShrink={1} maxWidth="100%" flexWrap="wrap">
              {pillContent}
            </Flex>
          </Flex>
        </TouchableArea>
      </Flex>
      <Flex gap="$spacing4" width="100%">
        <Flex row gap="$spacing4" alignItems="center" width="100%" minWidth={0}>
          {isFocused ? (
            <Trace logFocus element={ElementName.AuctionFloorPrice}>
              <Input
                ref={inputRef}
                autoFocus
                unstyled
                outlineStyle="none"
                $platform-web={{
                  fieldSizing: 'content',
                  minWidth: '1ch',
                  maxWidth: '100%',
                }}
                value={focusedDisplayValue}
                onChangeText={handleChange}
                onBlur={handleBlur}
                placeholder={`0${decimalSeparator}00`}
                placeholderTextColor="$neutral3"
                keyboardType="decimal-pad"
                fontFamily="$heading"
                fontSize={fonts.heading3.fontSize}
                lineHeight={fonts.heading3.lineHeight}
                fontWeight={fonts.heading3.fontWeight}
                color="$neutral1"
                backgroundColor="$transparent"
              />
            </Trace>
          ) : unfocusedNumeric === null ? (
            <Text variant="heading3" color="$neutral3" cursor="text" onPress={handleFocus}>
              {`0${decimalSeparator}00`}
            </Text>
          ) : (
            <TouchableArea onPress={handleFocus} flexShrink={1} minWidth={0} cursor="text">
              <SubscriptZeroPrice
                value={unfocusedNumeric}
                variant="heading3"
                color="$neutral1"
                minSignificantDigits={1}
                maxSignificantDigits={4}
                subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
                fontSize={fonts.heading3.fontSize}
                lineHeight={fonts.heading3.lineHeight}
                disableTooltip
              />
            </TouchableArea>
          )}
          <Text variant="heading3" color="$neutral2" flexShrink={0}>
            {inputLabel}
          </Text>
        </Flex>
        {bottomRowContent !== null && (
          <TouchableArea
            onPress={toggleInputCurrency}
            disabled={usdPriceNum === null}
            alignSelf="flex-start"
            maxWidth="100%"
          >
            <Flex row alignItems="center" gap="$spacing4" flexWrap="wrap" maxWidth="100%">
              <Flex row alignItems="baseline" gap="$spacing4" flexShrink={1} flexWrap="wrap" minWidth={0}>
                {bottomRowContent}
              </Flex>
              {usdPriceNum !== null && <ArrowDownArrowUp color="$neutral2" size="$icon.16" flexShrink={0} />}
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}

import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea, type GetRef } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { X } from 'ui/src/components/icons/X'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  type InputCurrency,
  MAX_POST_AUCTION_LIQUIDITY_TIERS,
  type PostAuctionLiquidityTier,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  clampPostAuctionLiquidityTierPercent,
  formatArithmeticResultForInput,
  formatCompactNumberDisplay,
  formatCompactNumberInput,
  getMinimumPostAuctionLiquidityTierMilestone,
  getPostAuctionLiquidityTierLpDollars,
  isAllowedCompactNumberInput,
  isUnboundedTier,
  isValidPartialPercentInput,
  parseCompactNumberInput,
} from '~/pages/Liquidity/CreateAuction/utils'

function isEffectiveUsdMode(inputCurrency: InputCurrency, usdPriceNum: number | null): usdPriceNum is number {
  return inputCurrency === 'usd' && usdPriceNum !== null && usdPriceNum > 0
}

function activeCurrencySymbol({
  inputCurrency,
  usdPriceNum,
  raiseCurrencySymbol,
  fiatCurrencyCode,
}: {
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  raiseCurrencySymbol: string
  fiatCurrencyCode: string
}): string {
  return isEffectiveUsdMode(inputCurrency, usdPriceNum) ? fiatCurrencyCode : raiseCurrencySymbol
}

/** Canonical raise string → display string in the active currency (compact form preserved if possible). */
function raiseStringToActiveDisplay({
  raiseString,
  inputCurrency,
  usdPriceNum,
}: {
  raiseString: string
  inputCurrency: InputCurrency
  usdPriceNum: number | null
}): string {
  if (!raiseString) {
    return ''
  }
  if (!isEffectiveUsdMode(inputCurrency, usdPriceNum)) {
    return raiseString
  }
  const raiseNum = parseCompactNumberInput(raiseString)
  if (raiseNum === null) {
    return ''
  }
  const usdAmount = raiseNum * usdPriceNum
  const compactUsd = formatCompactNumberInput(usdAmount)
  return compactUsd !== '' ? compactUsd : formatArithmeticResultForInput(usdAmount)
}

/** Display value in active currency (string) → canonical raise number. Returns null if invalid. */
function activeInputToRaiseNumber({
  value,
  inputCurrency,
  usdPriceNum,
}: {
  value: string
  inputCurrency: InputCurrency
  usdPriceNum: number | null
}): number | null {
  const parsed = parseCompactNumberInput(value)
  if (parsed === null || parsed <= 0) {
    return null
  }
  if (!isEffectiveUsdMode(inputCurrency, usdPriceNum)) {
    return parsed
  }
  return parsed / usdPriceNum
}

function formatTierLiquidityTotal({
  lpRaiseAmount,
  inputCurrency,
  usdPriceNum,
  raiseCurrencySymbol,
  fiatCurrencyCode,
}: {
  lpRaiseAmount: number
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  raiseCurrencySymbol: string
  fiatCurrencyCode: string
}): string {
  const usdMode = isEffectiveUsdMode(inputCurrency, usdPriceNum)
  const amount = usdMode ? lpRaiseAmount * usdPriceNum : lpRaiseAmount
  const display = amount > 0 ? formatCompactNumberDisplay(amount) : '0'
  return `${display} ${usdMode ? fiatCurrencyCode : raiseCurrencySymbol}`
}

type TierInputRef = GetRef<typeof Input>

function TierField({
  children,
  trailing,
  inputRef,
}: {
  children: ReactNode
  trailing?: ReactNode
  inputRef?: React.RefObject<TierInputRef | null>
}) {
  const focusInput = inputRef ? () => inputRef.current?.focus() : undefined

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$surface1"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded8"
      height={32}
      px="$spacing8"
      gap="$spacing8"
    >
      <Flex
        row
        flex={1}
        minWidth={0}
        alignItems="center"
        gap="$spacing4"
        cursor={focusInput ? 'text' : undefined}
        onPress={focusInput}
      >
        {children}
      </Flex>
      {trailing}
    </Flex>
  )
}

const PercentInput = forwardRef(function PercentInput(
  { percent, onUpdatePercent }: { percent: number; onUpdatePercent: (percent: number) => void },
  ref: React.ForwardedRef<TierInputRef>,
) {
  const [percentInput, setPercentInput] = useState(percent.toString())
  const [isFocused, setIsFocused] = useState(false)

  // Don't overwrite in-progress typing; the prop re-syncs on blur and while the field is unfocused.
  useEffect(() => {
    if (isFocused) {
      return
    }
    setPercentInput(percent.toString())
  }, [percent, isFocused])

  return (
    <>
      <Trace logFocus element={ElementName.AuctionLpBracketPercent}>
        <Input
          ref={ref}
          unstyled
          value={percentInput}
          onFocus={() => setIsFocused(true)}
          onChangeText={(value) => {
            if (!isValidPartialPercentInput(value)) {
              return
            }

            setPercentInput(value)
            // Propagate only values already within range (clamp is a no-op); clamping is deferred
            // to blur so partial entries (e.g. "5" en route to "50") aren't snapped mid-typing.
            const parsed = Number(value)
            if (Number.isFinite(parsed) && clampPostAuctionLiquidityTierPercent(parsed) === parsed) {
              onUpdatePercent(parsed)
            }
          }}
          onBlur={() => {
            setIsFocused(false)
            const parsed = Number(percentInput)
            if (!Number.isFinite(parsed) || parsed <= 0) {
              setPercentInput(percent.toString())
              return
            }
            const clamped = clampPostAuctionLiquidityTierPercent(parsed)
            setPercentInput(clamped.toString())
            onUpdatePercent(clamped)
          }}
          placeholder="25"
          placeholderTextColor="$neutral3"
          color="$neutral1"
          outlineStyle="none"
          fontSize={14}
          lineHeight={18}
          $platform-web={{ fieldSizing: 'content', minWidth: '1ch', maxWidth: '100%' }}
        />
      </Trace>
      <Text variant="body3" color="$neutral3" flexShrink={0} userSelect="none">
        %
      </Text>
    </>
  )
})

function BoundedTierRow({
  tier,
  previousMilestone,
  raiseCurrencySymbol,
  inputCurrency,
  usdPriceNum,
  fiatCurrencyCode,
  onUpdateMilestone,
  onUpdatePercent,
  onRemove,
}: {
  tier: PostAuctionLiquidityTier
  previousMilestone?: number
  raiseCurrencySymbol: string
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  fiatCurrencyCode: string
  onUpdateMilestone: (raiseValue: string) => void
  onUpdatePercent: (percent: number) => void
  onRemove: () => void
}) {
  const [milestoneInput, setMilestoneInput] = useState(() =>
    raiseStringToActiveDisplay({ raiseString: tier.raiseMilestone, inputCurrency, usdPriceNum }),
  )
  const [isFocused, setIsFocused] = useState(false)
  const prevInputCurrencyRef = useRef(inputCurrency)
  const milestoneInputRef = useRef<TierInputRef>(null)
  const percentInputRef = useRef<TierInputRef>(null)

  const minimumMilestone = getMinimumPostAuctionLiquidityTierMilestone(previousMilestone)

  useEffect(() => {
    const modeChanged = prevInputCurrencyRef.current !== inputCurrency
    prevInputCurrencyRef.current = inputCurrency
    if (isFocused && !modeChanged) {
      return
    }
    setMilestoneInput(raiseStringToActiveDisplay({ raiseString: tier.raiseMilestone, inputCurrency, usdPriceNum }))
  }, [tier.raiseMilestone, inputCurrency, usdPriceNum, isFocused])

  const lpTotalText = useMemo(() => {
    const candidateRaiseNum = activeInputToRaiseNumber({ value: milestoneInput, inputCurrency, usdPriceNum })
    const raiseMilestoneForCalc =
      candidateRaiseNum !== null ? formatArithmeticResultForInput(candidateRaiseNum) : tier.raiseMilestone
    const lpRaiseAmount = getPostAuctionLiquidityTierLpDollars(
      { raiseMilestone: raiseMilestoneForCalc, percent: tier.percent },
      previousMilestone,
    )
    return formatTierLiquidityTotal({
      lpRaiseAmount,
      inputCurrency,
      usdPriceNum,
      raiseCurrencySymbol,
      fiatCurrencyCode,
    })
  }, [
    milestoneInput,
    previousMilestone,
    raiseCurrencySymbol,
    fiatCurrencyCode,
    tier.percent,
    tier.raiseMilestone,
    inputCurrency,
    usdPriceNum,
  ])

  const symbol = activeCurrencySymbol({ inputCurrency, usdPriceNum, raiseCurrencySymbol, fiatCurrencyCode })

  return (
    <Flex row alignItems="center" gap="$spacing8">
      <Flex row flex={1} flexBasis={0} minWidth={0} gap="$spacing4">
        <Flex flex={1} flexBasis={0} minWidth={0}>
          <TierField inputRef={milestoneInputRef}>
            <Text variant="body3" color="$neutral2" flexShrink={0} userSelect="none">
              ≤
            </Text>
            <Trace logFocus element={ElementName.AuctionLpBracketMilestone}>
              <Input
                ref={milestoneInputRef}
                unstyled
                value={milestoneInput}
                onFocus={() => setIsFocused(true)}
                onChangeText={(value) => {
                  if (!isAllowedCompactNumberInput(value)) {
                    return
                  }

                  setMilestoneInput(value)
                  const raiseNum = activeInputToRaiseNumber({ value, inputCurrency, usdPriceNum })
                  if (raiseNum !== null && raiseNum >= minimumMilestone) {
                    onUpdateMilestone(formatArithmeticResultForInput(raiseNum))
                  }
                }}
                onBlur={() => {
                  setIsFocused(false)
                  const raiseNum = activeInputToRaiseNumber({ value: milestoneInput, inputCurrency, usdPriceNum })
                  if (raiseNum === null || raiseNum < minimumMilestone) {
                    setMilestoneInput(
                      raiseStringToActiveDisplay({ raiseString: tier.raiseMilestone, inputCurrency, usdPriceNum }),
                    )
                    return
                  }
                  onUpdateMilestone(formatArithmeticResultForInput(raiseNum))
                }}
                placeholder="100k"
                placeholderTextColor="$neutral3"
                color="$neutral1"
                outlineStyle="none"
                fontSize={14}
                lineHeight={18}
                $platform-web={{ fieldSizing: 'content', minWidth: '1ch', maxWidth: '100%' }}
              />
            </Trace>
            <Text variant="body3" color="$neutral3" flexShrink={0} userSelect="none">
              {symbol}
            </Text>
          </TierField>
        </Flex>

        <Flex flex={1} flexBasis={0} minWidth={0}>
          <TierField
            inputRef={percentInputRef}
            trailing={
              <Text variant="body3" color="$neutral3" flexShrink={0}>
                {lpTotalText}
              </Text>
            }
          >
            <PercentInput ref={percentInputRef} percent={tier.percent} onUpdatePercent={onUpdatePercent} />
          </TierField>
        </Flex>
      </Flex>
      <TouchableArea p="$spacing4" onPress={onRemove}>
        <X size="$icon.16" color="$neutral2" />
      </TouchableArea>
    </Flex>
  )
}

function UnboundedTierRow({
  tier,
  previousMilestone,
  raiseCurrencySymbol,
  inputCurrency,
  usdPriceNum,
  fiatCurrencyCode,
  onUpdatePercent,
}: {
  tier: PostAuctionLiquidityTier
  previousMilestone?: number
  raiseCurrencySymbol: string
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  fiatCurrencyCode: string
  onUpdatePercent: (percent: number) => void
}) {
  const { t } = useTranslation()
  const percentInputRef = useRef<TierInputRef>(null)
  const usdMode = isEffectiveUsdMode(inputCurrency, usdPriceNum)
  const symbol = usdMode ? fiatCurrencyCode : raiseCurrencySymbol
  const milestoneLabel = previousMilestone
    ? `> ${formatCompactNumberDisplay(usdMode ? previousMilestone * usdPriceNum : previousMilestone)} ${symbol}`
    : t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.noLimit')

  return (
    <Flex row alignItems="center" gap="$spacing8">
      <Flex row flex={1} flexBasis={0} minWidth={0} gap="$spacing4">
        <Flex flex={1} flexBasis={0} minWidth={0}>
          <TierField>
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {milestoneLabel}
            </Text>
          </TierField>
        </Flex>

        <Flex flex={1} flexBasis={0} minWidth={0}>
          <TierField inputRef={percentInputRef}>
            <PercentInput ref={percentInputRef} percent={tier.percent} onUpdatePercent={onUpdatePercent} />
          </TierField>
        </Flex>
      </Flex>

      <Flex width="$spacing24" height="$spacing24" opacity={0} />
    </Flex>
  )
}

interface PostAuctionLiquidityTieredEditorProps {
  raiseCurrencySymbol: string
  tiers: PostAuctionLiquidityTier[]
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  fiatCurrencyCode: string
  onAddTier: () => void
  onRemoveTier: (tierId: string) => void
  onUpdateTier: (tierId: string, config: Partial<Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>>) => void
}

export function PostAuctionLiquidityTieredEditor({
  raiseCurrencySymbol,
  tiers,
  inputCurrency,
  usdPriceNum,
  fiatCurrencyCode,
  onAddTier,
  onRemoveTier,
  onUpdateTier,
}: PostAuctionLiquidityTieredEditorProps) {
  const { t } = useTranslation()
  const boundedTiers = tiers.filter((tier) => !isUnboundedTier(tier))
  const unboundedTier = tiers.find(isUnboundedTier)
  const canAddTier = tiers.length < MAX_POST_AUCTION_LIQUIDITY_TIERS

  return (
    <Flex gap="$spacing8" pt="$spacing4">
      <Flex row alignItems="center" gap="$spacing8">
        <Flex row flex={1} flexBasis={0} minWidth={0} gap="$spacing4">
          <Flex flex={1} flexBasis={0} minWidth={0}>
            <Text variant="body4" color="$neutral1">
              {t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.raiseMilestone')}
            </Text>
          </Flex>
          <Flex flex={1} flexBasis={0} minWidth={0}>
            <Text variant="body4" color="$neutral1">
              {t(
                'toucan.createAuction.step.configureAuction.postAuctionLiquidity.percentOfRaiseMilestoneToLiquidityPool',
              )}
            </Text>
          </Flex>
        </Flex>
        <Flex width="$spacing24" height="$spacing24" opacity={0} />
      </Flex>

      {boundedTiers.map((tier, index) => (
        <BoundedTierRow
          key={tier.id}
          tier={tier}
          previousMilestone={
            index > 0
              ? (parseCompactNumberInput(boundedTiers[index - 1]?.raiseMilestone ?? '') ?? undefined)
              : undefined
          }
          raiseCurrencySymbol={raiseCurrencySymbol}
          inputCurrency={inputCurrency}
          usdPriceNum={usdPriceNum}
          fiatCurrencyCode={fiatCurrencyCode}
          onUpdateMilestone={(raiseMilestone) => onUpdateTier(tier.id, { raiseMilestone })}
          onUpdatePercent={(percent) => onUpdateTier(tier.id, { percent })}
          onRemove={() => onRemoveTier(tier.id)}
        />
      ))}

      {unboundedTier && (
        <UnboundedTierRow
          tier={unboundedTier}
          previousMilestone={
            boundedTiers.length > 0
              ? (parseCompactNumberInput(boundedTiers[boundedTiers.length - 1]?.raiseMilestone ?? '') ?? undefined)
              : undefined
          }
          raiseCurrencySymbol={raiseCurrencySymbol}
          inputCurrency={inputCurrency}
          usdPriceNum={usdPriceNum}
          fiatCurrencyCode={fiatCurrencyCode}
          onUpdatePercent={(percent) => onUpdateTier(unboundedTier.id, { percent })}
        />
      )}

      <TouchableArea
        row
        alignItems="center"
        gap="$spacing4"
        px="$spacing4"
        py="$spacing8"
        onPress={onAddTier}
        disabled={!canAddTier}
        opacity={canAddTier ? 1 : 0.5}
      >
        <Plus size="$icon.16" color={canAddTier ? '$neutral2' : '$neutral3'} />
        <Text variant="buttonLabel4" color={canAddTier ? '$neutral2' : '$neutral3'}>
          {t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.addTier')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}

import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useRef, useState, type ComponentRef, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, Tooltip, TouchableArea, useMedia } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { fonts } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { PercentButton } from '~/pages/Liquidity/CreateAuction/components/PercentButton'
import { PostAuctionLiquidityAllocationPopover } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquidityAllocationPopover'
import { PostAuctionLiquidityTieredEditor } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquidityTieredEditor'
import { type InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import {
  MAX_POST_AUCTION_LIQUIDITY_PERCENT,
  MIN_POST_AUCTION_LIQUIDITY_PERCENT,
  type PostAuctionLiquidityAllocation,
  PostAuctionLiquidityAllocationType,
  type PostAuctionLiquidityTier,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  isValidPartialPercentInput,
  MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES,
} from '~/pages/Liquidity/CreateAuction/utils'

type InputRef = ComponentRef<typeof Input>

const QUICK_SELECT_PERCENTS = [25, 50, 75, 100] as const

function formatPostAuctionPercentForUi(percent: number): string {
  if (!Number.isFinite(percent) || percent <= 0) {
    return ''
  }

  const normalized =
    Math.round(percent * 10 ** MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES) /
    10 ** MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES
  return normalized.toFixed(MAX_POST_AUCTION_PARTIAL_PERCENT_DECIMAL_PLACES).replace(/\.?0+$/, '')
}

interface PostAuctionLiquiditySelectorProps {
  allocation: PostAuctionLiquidityAllocation
  postAuctionLiquidityPercent: number
  raiseCurrencySymbol: string
  subtitle: string
  showSubtitleTooltip: boolean
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  fiatCurrencyCode: string
  onAllocationTypeSelect: (type: PostAuctionLiquidityAllocationType) => void
  onSelectPercent: (percent: number) => void
  onAddTier: () => void
  onUpdateTier: (tierId: string, config: Partial<Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>>) => void
  onRemoveTier: (tierId: string) => void
}

interface PostAuctionLiquiditySelectorCardHeaderProps {
  label: string
  headerHelpDescription: string
  allocationType: PostAuctionLiquidityAllocationType
  raiseCurrencySymbol: string
  onAllocationTypeSelect: (type: PostAuctionLiquidityAllocationType) => void
}

function PostAuctionLiquiditySelectorCardHeader({
  label,
  headerHelpDescription,
  allocationType,
  raiseCurrencySymbol,
  onAllocationTypeSelect,
}: PostAuctionLiquiditySelectorCardHeaderProps) {
  return (
    <Flex row alignItems="flex-start" justifyContent="space-between" gap="$spacing8" width="100%">
      <Flex
        row
        alignItems="flex-start"
        gap="$spacing4"
        flexShrink={1}
        minWidth={0}
        maxWidth="100%"
        $platform-web={{ width: 'fit-content' }}
      >
        <Text
          flexShrink={1}
          minWidth={0}
          variant="buttonLabel3"
          color="$neutral2"
          $platform-web={{ overflowWrap: 'anywhere' }}
        >
          {label}
        </Text>
        <Flex flexShrink={0} alignSelf="flex-start">
          <Tooltip placement="top">
            <Tooltip.Trigger asChild>
              <Flex cursor="help" aria-label={headerHelpDescription}>
                <QuestionInCircleFilled size="$icon.16" color="$neutral3" />
              </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              <Text variant="body4" color="$neutral1" maxWidth={280}>
                {headerHelpDescription}
              </Text>
            </Tooltip.Content>
          </Tooltip>
        </Flex>
      </Flex>

      <Flex flexShrink={0}>
        <PostAuctionLiquidityAllocationPopover
          allocationType={allocationType}
          raiseCurrencySymbol={raiseCurrencySymbol}
          onSelectType={onAllocationTypeSelect}
        />
      </Flex>
    </Flex>
  )
}

interface PostAuctionLiquiditySingleAllocationEditorProps {
  stackCompactLayout: boolean
  postAuctionLiquidityPercent: number
  subtitle: string
  showSubtitleTooltip: boolean
  isFocused: boolean
  rawInput: string
  isInvalid: boolean
  showMinTooltip: boolean
  isMinActive: boolean
  inputRef: RefObject<InputRef | null>
  subtitleFloorPriceTooltipContent: string
  minPercentTooltipContent: string
  onFocus: () => void
  onBlur: () => void
  onChange: (value: string) => void
  onSelectionChange: () => void
  onPercentDisplayPress: () => void
  onSelectPercent: (percent: number) => void
}

function PostAuctionLiquiditySingleAllocationEditor({
  stackCompactLayout,
  postAuctionLiquidityPercent,
  subtitle,
  showSubtitleTooltip,
  isFocused,
  rawInput,
  isInvalid,
  showMinTooltip,
  isMinActive,
  inputRef,
  subtitleFloorPriceTooltipContent,
  minPercentTooltipContent,
  onFocus,
  onBlur,
  onChange,
  onSelectionChange,
  onPercentDisplayPress,
  onSelectPercent,
}: PostAuctionLiquiditySingleAllocationEditorProps) {
  return (
    <Flex
      row={!stackCompactLayout}
      alignItems={stackCompactLayout ? 'stretch' : 'center'}
      justifyContent={stackCompactLayout ? 'flex-start' : 'space-between'}
      gap={stackCompactLayout ? '$spacing12' : '$spacing8'}
      width="100%"
    >
      <Flex
        flex={stackCompactLayout ? undefined : 1}
        flexBasis={stackCompactLayout ? undefined : 0}
        flexGrow={stackCompactLayout ? undefined : 1}
        minWidth={0}
        gap="$spacing4"
        maxWidth="100%"
      >
        <Flex row alignItems="center" flexWrap="wrap" gap="$spacing4" minWidth={0}>
          {isFocused ? (
            <Trace logFocus element={ElementName.AuctionLpPct}>
              <Input
                ref={inputRef}
                autoFocus
                unstyled
                outlineStyle="none"
                value={`${rawInput}%`}
                onChangeText={(value: string) => onChange(value.replace(/%/g, ''))}
                onFocus={onFocus}
                onBlur={onBlur}
                onSelectionChange={onSelectionChange}
                placeholder="0%"
                placeholderTextColor="$neutral3"
                fontFamily="$heading"
                fontSize={fonts.heading3.fontSize}
                lineHeight={fonts.heading3.lineHeight}
                fontWeight={fonts.heading3.fontWeight}
                color={isInvalid ? '$statusCritical' : '$neutral1'}
                backgroundColor="$transparent"
                width="100%"
              />
            </Trace>
          ) : (
            <Text variant="heading3" color="$neutral1" cursor="text" onPress={onPercentDisplayPress}>
              {`${formatPostAuctionPercentForUi(postAuctionLiquidityPercent) || '0'}%`}
            </Text>
          )}
        </Flex>

        {showSubtitleTooltip ? (
          <Tooltip placement="left">
            <Tooltip.Trigger asChild>
              <Flex cursor="help" alignSelf="flex-start">
                <Text variant="body4" color="$neutral2">
                  {subtitle}
                </Text>
              </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              <Text variant="body4" color="$neutral1" maxWidth={280}>
                {subtitleFloorPriceTooltipContent}
              </Text>
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Flex alignSelf="flex-start">
            <Text variant="body4" color="$neutral2">
              {subtitle}
            </Text>
          </Flex>
        )}
      </Flex>

      <Flex
        gap="$spacing2"
        maxWidth="100%"
        alignSelf={stackCompactLayout ? 'stretch' : 'flex-end'}
        width={stackCompactLayout ? '100%' : undefined}
        flexShrink={0}
        $platform-web={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          ...(!stackCompactLayout ? { width: 'min(100%, 20rem)' } : {}),
        }}
      >
        <Flex minWidth={0} width="100%">
          <Tooltip placement="bottom" open={showMinTooltip}>
            <TouchableArea
              width="100%"
              minWidth={0}
              overflow="hidden"
              backgroundColor={isMinActive ? '$surface3' : 'transparent'}
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$rounded16"
              px="$spacing8"
              py="$spacing6"
              onPress={() => onSelectPercent(MIN_POST_AUCTION_LIQUIDITY_PERCENT)}
            >
              <Tooltip.Trigger asChild>
                <Flex alignItems="center" justifyContent="center">
                  <Text variant="buttonLabel4" color="$neutral1" textAlign="center" numberOfLines={1}>
                    {`${MIN_POST_AUCTION_LIQUIDITY_PERCENT}%`}
                  </Text>
                </Flex>
              </Tooltip.Trigger>
            </TouchableArea>
            <Tooltip.Content>
              <Tooltip.Arrow />
              <Text variant="body4" color="$neutral1" maxWidth={250}>
                {minPercentTooltipContent}
              </Text>
            </Tooltip.Content>
          </Tooltip>
        </Flex>

        {QUICK_SELECT_PERCENTS.filter((pct) => pct !== MIN_POST_AUCTION_LIQUIDITY_PERCENT).map((pct) => (
          <PercentButton
            key={pct}
            label={`${pct}%`}
            isActive={postAuctionLiquidityPercent === pct}
            onPress={() => onSelectPercent(pct)}
          />
        ))}
      </Flex>
    </Flex>
  )
}

export function PostAuctionLiquiditySelector({
  allocation,
  postAuctionLiquidityPercent,
  raiseCurrencySymbol,
  subtitle,
  showSubtitleTooltip,
  inputCurrency,
  usdPriceNum,
  fiatCurrencyCode,
  onAllocationTypeSelect,
  onSelectPercent,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
}: PostAuctionLiquiditySelectorProps) {
  const { t } = useTranslation()
  const media = useMedia()
  // `md` → ui/src/theme/media.ts (maxWidth: breakpoints.md); same breakpoint as auction supply presets.
  const stackCompactLayout = Boolean(media.md)
  const inputRef = useRef<InputRef>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')
  const [showMinTooltip, setShowMinTooltip] = useState(false)

  const clampCaret = useCallback(() => {
    const el = inputRef.current as unknown as HTMLInputElement | null
    if (!el) {
      return
    }

    const max = el.value.length - 1
    if ((el.selectionStart ?? 0) > max || (el.selectionEnd ?? 0) > max) {
      el.setSelectionRange(Math.min(el.selectionStart ?? max, max), Math.min(el.selectionEnd ?? max, max))
    }
  }, [])

  const parsedInput = isFocused ? Number(rawInput) : null
  const isInvalid =
    parsedInput !== null &&
    rawInput !== '' &&
    Number.isFinite(parsedInput) &&
    (parsedInput < MIN_POST_AUCTION_LIQUIDITY_PERCENT || parsedInput > MAX_POST_AUCTION_LIQUIDITY_PERCENT)

  const handleChange = useCallback(
    (value: string) => {
      if (!isValidPartialPercentInput(value)) {
        return
      }

      setRawInput(value)
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return
      }

      setShowMinTooltip(parsed < MIN_POST_AUCTION_LIQUIDITY_PERCENT)
      onSelectPercent(
        Math.min(Math.max(parsed, MIN_POST_AUCTION_LIQUIDITY_PERCENT), MAX_POST_AUCTION_LIQUIDITY_PERCENT),
      )
    },
    [onSelectPercent],
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setShowMinTooltip(false)
    setRawInput(formatPostAuctionPercentForUi(postAuctionLiquidityPercent))
  }, [postAuctionLiquidityPercent])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    setShowMinTooltip(false)

    const parsed = Number(rawInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return
    }

    onSelectPercent(Math.min(Math.max(parsed, MIN_POST_AUCTION_LIQUIDITY_PERCENT), MAX_POST_AUCTION_LIQUIDITY_PERCENT))
  }, [onSelectPercent, rawInput])

  const trace = useTrace()
  const handleSelectPercent = useCallback(
    (percent: number) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionLpPctPreset })
      setIsFocused(false)
      setRawInput('')
      setShowMinTooltip(false)
      onSelectPercent(percent)
    },
    [onSelectPercent, trace],
  )

  const isMinActive = postAuctionLiquidityPercent === MIN_POST_AUCTION_LIQUIDITY_PERCENT
  const isTiered = allocation.type === PostAuctionLiquidityAllocationType.TIERED
  const label = isTiered
    ? t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.tieredLabel')
    : t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.label', {
        raiseCurrency: raiseCurrencySymbol,
      })

  const headerHelpDescription = isTiered
    ? t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.tieredAllocationDescription', {
        raiseCurrency: raiseCurrencySymbol,
      })
    : t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.singleAllocationDescription', {
        raiseCurrency: raiseCurrencySymbol,
      })

  const subtitleFloorPriceTooltipContent = t(
    'toucan.createAuction.step.configureAuction.postAuctionLiquidity.subtitleFloorPriceTooltip',
  )
  const minPercentTooltipContent = t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.minTooltip')

  return (
    <Flex
      backgroundColor="$surface2"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing16"
    >
      <PostAuctionLiquiditySelectorCardHeader
        label={label}
        headerHelpDescription={headerHelpDescription}
        allocationType={allocation.type}
        raiseCurrencySymbol={raiseCurrencySymbol}
        onAllocationTypeSelect={onAllocationTypeSelect}
      />

      {isTiered ? (
        <PostAuctionLiquidityTieredEditor
          raiseCurrencySymbol={raiseCurrencySymbol}
          tiers={allocation.tiers}
          inputCurrency={inputCurrency}
          usdPriceNum={usdPriceNum}
          fiatCurrencyCode={fiatCurrencyCode}
          onAddTier={onAddTier}
          onUpdateTier={onUpdateTier}
          onRemoveTier={onRemoveTier}
        />
      ) : (
        <PostAuctionLiquiditySingleAllocationEditor
          stackCompactLayout={stackCompactLayout}
          postAuctionLiquidityPercent={postAuctionLiquidityPercent}
          subtitle={subtitle}
          showSubtitleTooltip={showSubtitleTooltip}
          isFocused={isFocused}
          rawInput={rawInput}
          isInvalid={isInvalid}
          showMinTooltip={showMinTooltip}
          isMinActive={isMinActive}
          inputRef={inputRef}
          subtitleFloorPriceTooltipContent={subtitleFloorPriceTooltipContent}
          minPercentTooltipContent={minPercentTooltipContent}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onSelectionChange={clampCaret}
          onPercentDisplayPress={handleFocus}
          onSelectPercent={handleSelectPercent}
        />
      )}
    </Flex>
  )
}

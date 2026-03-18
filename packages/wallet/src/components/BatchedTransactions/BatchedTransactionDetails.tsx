import { BigNumber } from '@ethersproject/bignumber'
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { GradientOverlay, ScrollArrow } from 'uniswap/src/components/BatchedTransactions/CarouselControls'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'
import { trimToLength } from 'utilities/src/primitives/string'
import { useEvent } from 'utilities/src/react/hooks'
import { AddressButton } from 'wallet/src/components/buttons/AddressButton'
import { useCopyToClipboard } from 'wallet/src/components/copy/useCopyToClipboard'
import { Call } from 'wallet/src/features/dappRequests/types'
import { SpendingEthDetails } from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'

export const MAX_HIDDEN_CALLS_BY_DEFAULT = 10
const MAX_MODAL_MESSAGE_HEIGHT = 200
const CALLDATA_PREVIEW_LENGTH = 7
const SCROLL_THROTTLE_MS = 16
const GRADIENT_THRESHOLD_RATIO = 0.25

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}

function CallDetails({ chainId, call }: { chainId: UniverseChainId; call: Call }): JSX.Element {
  const { t } = useTranslation()
  const { to, value, data } = call
  const colors = useSporeColors()
  const copyToClipboard = useCopyToClipboard()

  const onCopyCalldata = async (): Promise<void> => {
    if (!data) {
      return
    }
    await copyToClipboard({
      textToCopy: data,
      copyType: CopyNotificationType.Calldata,
    })
  }

  const formattedCalldata = useMemo(() => {
    if (!data) {
      return data
    }
    return trimToLength(data, CALLDATA_PREVIEW_LENGTH)
  }, [data])

  return (
    <Flex gap="$spacing12">
      {value && !BigNumber.from(value).eq(0) ? <SpendingEthDetails chainId={chainId} value={value} /> : null}
      {to ? (
        <ContentRow label={t('common.text.recipient')} variant="body3">
          <AddressButton address={to} chainId={chainId} />
        </ContentRow>
      ) : null}
      <ContentRow label={t('transaction.callData')} variant="body3">
        <TouchableArea hitSlop={16} testID={TestID.Copy} onPress={onCopyCalldata}>
          <Flex row gap="$spacing4">
            <Text color="$neutral1" variant="body3">
              {formattedCalldata}
            </Text>
            <CopySheets color={colors.neutral3.get()} size={iconSizes.icon16} />
          </Flex>
        </TouchableArea>
      </ContentRow>
    </Flex>
  )
}

const CallCard = ({ call, width, chainId }: { call: Call; width: number; chainId: UniverseChainId }): JSX.Element => (
  <Flex
    style={isMobileApp ? undefined : { scrollSnapAlign: 'start' }}
    backgroundColor="$surface2"
    borderColor="$surface3"
    borderRadius="$rounded16"
    borderWidth="$spacing1"
    flexShrink={0}
    width={width}
  >
    <Flex p="$spacing16" style={requestMessageStyle}>
      <CallDetails call={call} chainId={chainId} />
    </Flex>
  </Flex>
)

export function BatchedTransactionDetails({
  calls,
  chainId = UniverseChainId.Mainnet,
  parentWidth,
}: {
  calls: Call[]
  chainId?: UniverseChainId
  parentWidth: number
}): JSX.Element {
  // Ref for  ScrollView/div (web)
  const scrollRef = useRef<ScrollView | HTMLDivElement>(null)
  const colors = useSporeColors()
  const [showRightGradient, setShowRightGradient] = useState(calls.length > 1)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasMultipleCalls = calls.length > 1
  const iconHorizontalPadding = spacing.spacing8
  const iconSize = iconSizes.icon24
  const cardGap = spacing.spacing16 // Gap between cards

  const arrowSpace =
    isExtensionApp && hasMultipleCalls ? iconSize * 2 + iconHorizontalPadding * 2 + spacing.spacing12 * 2 : 0

  const horizontalShift = isExtensionApp ? arrowSpace : hasMultipleCalls ? spacing.spacing48 : 0

  const layoutMeasurements = useMemo(() => {
    const baseHorizontalPadding = isExtensionApp ? spacing.spacing12 * 2 : spacing.spacing24 * 2
    const totalPadding = baseHorizontalPadding + horizontalShift

    const cardWidth = parentWidth - totalPadding

    // Snap interval needs to account for the card width and the gap between cards
    const snapToInterval = cardWidth + cardGap
    const gradientWidth = spacing.spacing24 + spacing.spacing16

    return { cardWidth, snapToInterval, gradientWidth, totalPadding }
  }, [horizontalShift, parentWidth, cardGap])

  const keyExtractor = (_: Call, index: number): string => `call-${index}`

  // Scroll handler for both mobile (NativeSyntheticEvent) and web (React.UIEvent)
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent> | React.UIEvent<HTMLDivElement>): void => {
      const getScrollMetrics = (
        evt: NativeSyntheticEvent<NativeScrollEvent> | React.UIEvent<HTMLDivElement>,
      ): { scrollX: number; contentWidth: number; containerWidth: number } | null => {
        if ('nativeEvent' in evt && 'contentOffset' in evt.nativeEvent) {
          // React Native event
          const nativeEvent = evt.nativeEvent as NativeScrollEvent
          return {
            scrollX: nativeEvent.contentOffset.x,
            contentWidth: nativeEvent.contentSize.width,
            containerWidth: nativeEvent.layoutMeasurement.width,
          }
        } else {
          // Web event
          const target = evt.currentTarget as HTMLDivElement
          return {
            scrollX: target.scrollLeft,
            contentWidth: target.scrollWidth,
            containerWidth: target.clientWidth,
          }
        }
      }

      const metrics = getScrollMetrics(event)
      if (!metrics) {
        return
      }

      const { scrollX, contentWidth, containerWidth } = metrics
      const thresholdDistance = containerWidth * GRADIENT_THRESHOLD_RATIO

      // Update current index based on scroll position
      const calculatedIndex = Math.round(scrollX / layoutMeasurements.snapToInterval)
      const newIndex = Math.max(0, Math.min(calls.length - 1, calculatedIndex))
      if (currentIndex !== newIndex) {
        setCurrentIndex(newIndex)
      }

      // Update gradient visibility states
      const distanceFromEnd = contentWidth - (scrollX + containerWidth)
      const shouldShowRightGradient = distanceFromEnd > thresholdDistance
      const shouldShowLeftGradient = scrollX > thresholdDistance

      if (showRightGradient !== shouldShowRightGradient) {
        setShowRightGradient(shouldShowRightGradient)
      }

      if (showLeftGradient !== shouldShowLeftGradient) {
        setShowLeftGradient(shouldShowLeftGradient)
      }
    },
    [layoutMeasurements.snapToInterval, calls.length, showRightGradient, showLeftGradient, currentIndex],
  )

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= calls.length || !scrollRef.current) {
        return
      }

      const targetScrollPosition = index * layoutMeasurements.snapToInterval - arrowSpace / 2

      const element = scrollRef.current as HTMLDivElement
      element.scrollTo({
        left: targetScrollPosition,
        behavior: 'smooth',
      })
      setCurrentIndex(index)
    },
    [arrowSpace, calls.length, layoutMeasurements.snapToInterval],
  )

  const renderFlatListItem = useCallback(
    ({ item }: ListRenderItemInfo<Call>): JSX.Element => {
      return (
        <Flex width={layoutMeasurements.cardWidth}>
          <CallCard call={item} width={layoutMeasurements.cardWidth} chainId={chainId} />
        </Flex>
      )
    },
    [layoutMeasurements.cardWidth, chainId],
  )

  return (
    <Flex row alignItems="center" position="relative" pt="$spacing4">
      {/* Left arrow button - visible only on extension with multiple calls */}
      {isExtensionApp && hasMultipleCalls && currentIndex > 0 && (
        <ScrollArrow side="left" onPress={() => scrollToIndex(currentIndex - 1)} />
      )}
      {/* Scrollable Content Area for extension */}
      {isExtensionApp ? (
        <Flex
          ref={scrollRef as React.RefObject<HTMLDivElement | null>}
          {...{
            overflowX: 'hidden',
            overflowY: 'hidden',
            UNSAFE_style: {
              scrollSnapType: 'x mandatory',
              '-ms-overflow-style': 'none',
              scrollbarWidth: 'none',
              '::-webkit-scrollbar': {
                display: 'none',
              },
            },
            onScroll: handleScroll as (event: React.UIEvent<HTMLDivElement>) => void,
          }}
          row
          flex={1}
          px={spacing.spacing12}
          gap={cardGap}
        >
          {calls.map((call, index) => (
            <CallCard
              key={keyExtractor(call, index)}
              call={call}
              width={layoutMeasurements.cardWidth}
              chainId={chainId}
            />
          ))}
        </Flex>
      ) : (
        <FlatList
          horizontal
          snapToInterval={layoutMeasurements.snapToInterval}
          decelerationRate="fast"
          contentContainerStyle={{
            gap: cardGap,
            paddingHorizontal: spacing.spacing24,
          }}
          data={calls}
          keyExtractor={keyExtractor}
          renderItem={renderFlatListItem}
          scrollEnabled={true}
          scrollEventThrottle={SCROLL_THROTTLE_MS}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll as (event: NativeSyntheticEvent<NativeScrollEvent>) => void}
        />
      )}
      {/* Right arrow button - visible only on extension with multiple calls */}
      {isExtensionApp && hasMultipleCalls && currentIndex < calls.length - 1 && (
        <ScrollArrow side="right" onPress={() => scrollToIndex(currentIndex + 1)} />
      )}
      {/* Left gradient overlay */}
      {hasMultipleCalls && (
        <GradientOverlay
          position="left"
          show={showLeftGradient}
          width={layoutMeasurements.gradientWidth}
          colors={colors}
        />
      )}
      {/* Right gradient overlay */}
      {hasMultipleCalls && (
        <GradientOverlay
          position="right"
          show={showRightGradient}
          width={layoutMeasurements.gradientWidth}
          colors={colors}
        />
      )}
    </Flex>
  )
}

interface BatchedRequestDetailsContentProps {
  calls: Call[]
  chainId?: UniverseChainId
}
export const BatchedRequestDetailsContent = forwardRef<HTMLDivElement, BatchedRequestDetailsContentProps>(
  function BatchedRequestDetailsContent(
    { calls, chainId = UniverseChainId.Mainnet }: BatchedRequestDetailsContentProps,
    ref,
  ): JSX.Element {
    const { t } = useTranslation()

    const isSingleCall = calls.length === 1
    const isOpenedByDefault = calls.length >= MAX_HIDDEN_CALLS_BY_DEFAULT

    const [expanded, setExpanded] = useState(isSingleCall || isOpenedByDefault)
    const [width, setWidth] = useState<number | undefined>(undefined)

    const onLayout = useEvent((event: LayoutChangeEvent) => {
      setWidth(event.nativeEvent.layout.width)
    })

    return (
      <Flex ref={ref} onLayout={onLayout}>
        {!isSingleCall && (
          <ExpandoRow
            mx="$spacing12"
            label={t('walletConnect.request.bundledTransactions.label', { count: calls.length })}
            isExpanded={expanded}
            onPress={() => setExpanded(!expanded)}
          />
        )}
        {expanded && width && <BatchedTransactionDetails parentWidth={width} calls={calls} chainId={chainId} />}
      </Flex>
    )
  },
)

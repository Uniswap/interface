import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, GeneratedIcon, LinearGradient, Text, TouchableArea } from 'ui/src'
import { ArrowLeft } from 'ui/src/components/icons/ArrowLeft'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import {
  CARD_SPACING,
  TOKEN_CARD_WIDTH,
  TokenCarouselCard,
} from '~/pages/TokenDetails/components/TokenCarousel/TokenCarouselCard'
import { useTopTokens } from '~/state/explore/topTokens/useTopTokens'

const MAX_CAROUSEL_TOKENS = 20
const GRADIENT_WIDTH = 80
const GRADIENT_THRESHOLD = GRADIENT_WIDTH / 2
const GRADIENT_STYLE: ComponentProps<typeof LinearGradient>['style'] = {
  position: 'absolute',
  top: 0,
  width: GRADIENT_WIDTH,
  height: '100%',
  zIndex: 1,
  pointerEvents: 'none',
}

export function TokenCarousel({
  title,
  tooltipText,
  chainId,
}: {
  title: string
  tooltipText?: string
  chainId: UniverseChainId
}): JSX.Element | null {
  const { topTokens, sparklines } = useTopTokens(chainId)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMaxScrolled, setIsMaxScrolled] = useState(false)
  const [isMinScrolled, setIsMinScrolled] = useState(false)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(true)

  const carouselTokens = useMemo(() => {
    return topTokens?.slice(0, MAX_CAROUSEL_TOKENS) ?? []
  }, [topTokens])

  const moveScroll = useEvent((direction: 'left' | 'right'): void => {
    const container = scrollRef.current
    if (!container) {
      return
    }

    const currentItemIndex = Math.floor((container.scrollLeft + GRADIENT_WIDTH / 2) / (TOKEN_CARD_WIDTH + CARD_SPACING))
    const numberOfVisibleItems = Math.floor(container.clientWidth / (TOKEN_CARD_WIDTH + CARD_SPACING))

    const newItemIndex =
      direction === 'left' ? currentItemIndex - numberOfVisibleItems : currentItemIndex + numberOfVisibleItems

    const gradientOffsetPixels = -GRADIENT_WIDTH / 2

    container.scrollTo({
      left: newItemIndex * (TOKEN_CARD_WIDTH + CARD_SPACING) + gradientOffsetPixels,
      behavior: 'smooth',
    })
    setTimeout(() => {
      updateScrollEffects()
    }, 0)
  })

  const handleLeftPress = useEvent((): void => {
    moveScroll('left')
  })

  const handleRightPress = useEvent((): void => {
    moveScroll('right')
  })

  const updateScrollEffects = useEvent((): void => {
    const container = scrollRef.current
    if (!container) {
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = container
    const maxScroll = scrollWidth - clientWidth
    const distanceFromEnd = maxScroll - scrollLeft

    setIsMinScrolled(scrollLeft <= 0)
    setIsMaxScrolled(distanceFromEnd <= 0)
    setShowLeftGradient(scrollLeft > GRADIENT_THRESHOLD)
    setShowRightGradient(distanceFromEnd > GRADIENT_THRESHOLD)
  })

  // Register scroll listening
  useEffect(() => {
    const container = scrollRef.current
    if (!container) {
      return undefined
    }

    container.addEventListener('scroll', updateScrollEffects)
    updateScrollEffects()

    return () => {
      container.removeEventListener('scroll', updateScrollEffects)
    }
  }, [updateScrollEffects])

  if (carouselTokens.length === 0) {
    return null
  }

  return (
    <Flex pt="$spacing32" gap="$gap16">
      <Flex row justifyContent="space-between" alignItems="center">
        <MouseoverTooltip disabled={!tooltipText} size={TooltipSize.ExtraSmall} text={tooltipText} placement="top">
          <Text variant="heading3">{title}</Text>
        </MouseoverTooltip>
        <Flex row gap="$spacing8">
          {!isMinScrolled && <IconButton Icon={ArrowLeft} onPress={handleLeftPress} />}
          <IconButton Icon={ArrowRight} disabled={isMaxScrolled} onPress={handleRightPress} />
        </Flex>
      </Flex>
      <Flex position="relative">
        {showLeftGradient && (
          <LinearGradient
            colors={['surface1', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[GRADIENT_STYLE, { left: 0 }]}
          />
        )}
        {showRightGradient && (
          <LinearGradient
            colors={['surface1', 'transparent']}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 1 }}
            style={[GRADIENT_STYLE, { right: 0 }]}
          />
        )}
        <Flex ref={scrollRef} row overflow="scroll" gap="$gap12" pl="$spacing2" scrollbarWidth="none">
          {carouselTokens.map((token) => (
            <TokenCarouselCard key={`${token.address}-${token.chain}`} token={token} sparklines={sparklines} />
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}

function IconButton({
  Icon,
  onPress,
  disabled,
}: {
  Icon: GeneratedIcon
  onPress?: () => void
  disabled?: boolean
}): JSX.Element {
  return (
    <TouchableArea
      disabled={disabled}
      onPress={onPress}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      opacity={disabled ? 0.15 : 1}
      p="$spacing8"
    >
      <Icon size="$icon.16" color="$neutral1" />
    </TouchableArea>
  )
}

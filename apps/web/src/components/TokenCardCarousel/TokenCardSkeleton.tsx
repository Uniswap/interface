import { Flex, fonts, iconSizes } from '@universe/mycelium'
import {
  TOKEN_CARD_SPARKLINE_HEIGHT_HORIZONTAL,
  TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL,
  TOKEN_CARD_SPARKLINE_WIDTH,
  tokenCardShellProps,
} from 'uniswap/src/components/TokenCard/constants'
import type { TokenCardProps } from 'uniswap/src/components/TokenCard/types'
import { LoadingBubble } from '~/components/Tokens/loading'

export type TokenCardSkeletonLayout = TokenCardProps['layout']

function LogoBubble({ delay }: { delay: string }): JSX.Element {
  return (
    <LoadingBubble
      round
      height={iconSizes.icon32}
      width={iconSizes.icon32}
      delay={delay}
      containerProps={{ width: iconSizes.icon32, height: iconSizes.icon32, flexShrink: 0 }}
    />
  )
}

function SparklineBubble({ delay, height }: { delay: string; height: number }): JSX.Element {
  return (
    <LoadingBubble
      height={height}
      width={TOKEN_CARD_SPARKLINE_WIDTH}
      delay={delay}
      containerProps={{ width: TOKEN_CARD_SPARKLINE_WIDTH, flexShrink: 0 }}
      skeletonProps={{ borderRadius: '$rounded8' }}
    />
  )
}

function TextLineBubble({ delay, height, width }: { delay: string; height: number; width: string }): JSX.Element {
  return (
    <LoadingBubble
      height={height}
      width={width}
      delay={delay}
      containerProps={{ width: '100%' }}
      skeletonProps={{ borderRadius: '$rounded8' }}
    />
  )
}

function TokenCardSkeletonVertical({ delay }: { delay: string }): JSX.Element {
  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" width="100%">
        <LogoBubble delay={delay} />
        <SparklineBubble delay={delay} height={TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL} />
      </Flex>
      <Flex gap="$spacing4" width="100%">
        <TextLineBubble delay={delay} height={fonts.body2.fontSize} width="70%" />
        <TextLineBubble delay={delay} height={fonts.body3.fontSize} width="50%" />
      </Flex>
    </>
  )
}

function TokenCardSkeletonHorizontal({ delay }: { delay: string }): JSX.Element {
  return (
    <>
      <LogoBubble delay={delay} />
      <Flex fill minWidth={0}>
        <Flex height={fonts.body2.lineHeight} justifyContent="center">
          <TextLineBubble delay={delay} height={fonts.body2.fontSize} width="60%" />
        </Flex>
        <Flex height={fonts.body3.lineHeight} justifyContent="center">
          <TextLineBubble delay={delay} height={fonts.body3.fontSize} width="40%" />
        </Flex>
      </Flex>
      <SparklineBubble delay={delay} height={TOKEN_CARD_SPARKLINE_HEIGHT_HORIZONTAL} />
    </>
  )
}

export function TokenCardSkeleton({
  index,
  cardWidth,
  layout,
}: {
  index: number
  cardWidth: TokenCardProps['width']
  layout: TokenCardSkeletonLayout
}): JSX.Element {
  const delay = `${index * 0.1}s`
  const isHorizontal = layout === 'horizontal'

  return (
    <Flex
      {...tokenCardShellProps}
      width={cardWidth}
      row={isHorizontal}
      alignItems={isHorizontal ? 'center' : undefined}
    >
      {isHorizontal ? <TokenCardSkeletonHorizontal delay={delay} /> : <TokenCardSkeletonVertical delay={delay} />}
    </Flex>
  )
}

export function TokenCardSkeletonRow({
  cardWidth,
  count,
  layout,
}: {
  cardWidth: TokenCardProps['width']
  count: number
  layout: TokenCardSkeletonLayout
}): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <TokenCardSkeleton key={index} index={index} cardWidth={cardWidth} layout={layout} />
      ))}
    </>
  )
}

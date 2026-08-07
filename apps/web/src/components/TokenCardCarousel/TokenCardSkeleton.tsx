import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import {
  TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL,
  TOKEN_CARD_SPARKLINE_WIDTH,
  tokenCardShellProps,
} from 'uniswap/src/components/TokenCard/constants'
import { LoadingBubble } from '~/components/Tokens/loading'

export function TokenCardSkeleton({ index, cardWidth }: { index: number; cardWidth: number }): JSX.Element {
  const delay = `${index * 0.1}s`

  return (
    <Flex {...tokenCardShellProps} width={cardWidth}>
      <Flex row alignItems="center" justifyContent="space-between" width="100%">
        <LoadingBubble
          round
          height={iconSizes.icon32}
          width={iconSizes.icon32}
          delay={delay}
          containerProps={{ width: iconSizes.icon32, height: iconSizes.icon32, flexShrink: 0 }}
        />
        <LoadingBubble
          height={TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL}
          width={TOKEN_CARD_SPARKLINE_WIDTH}
          delay={delay}
          containerProps={{ width: TOKEN_CARD_SPARKLINE_WIDTH, flexShrink: 0 }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
      <Flex gap="$spacing4" width="100%">
        <LoadingBubble
          height={18}
          width="70%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
        <LoadingBubble
          height={16}
          width="50%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
    </Flex>
  )
}

export function TokenCardSkeletonRow({ cardWidth, count }: { cardWidth: number; count: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <TokenCardSkeleton key={index} index={index} cardWidth={cardWidth} />
      ))}
    </>
  )
}

import { LoadingBubble } from 'components/Tokens/loading'
import { ForwardedRef, forwardRef, PropsWithChildren } from 'react'
import { Flex, FlexProps, TamaguiElement, useMedia } from 'ui/src'

export const Cell = forwardRef(
  (
    {
      loading,
      children,
      testId,
      ...rest
    }: PropsWithChildren<{ loading?: boolean; testId?: string } & Partial<FlexProps>>,
    ref: ForwardedRef<TamaguiElement>,
  ) => {
    const media = useMedia()
    const paddingY = rest.py ?? (media.lg ? '$spacing12' : '$spacing16')
    // Calculate loading bubble height based on cell padding to ensure consistent dimensions
    const loadingBubbleHeight = media.lg ? '$spacing32' : '$spacing16'

    return (
      <Flex
        row
        overflow="hidden"
        $platform-web={{
          fontVariantNumeric: 'lining-nums tabular-nums',
        }}
        data-testid={testId}
        justifyContent={rest.justifyContent ?? 'flex-end'}
        px={rest.px ?? '$spacing12'}
        py={paddingY}
        alignItems={rest.alignItems ?? 'center'}
        ref={ref}
        {...rest}
      >
        {loading ? (
          <LoadingBubble height={loadingBubbleHeight} width="75%" data-testid="cell-loading-bubble" />
        ) : (
          children
        )}
      </Flex>
    )
  },
)

Cell.displayName = 'Cell'

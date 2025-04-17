import { LoadingBubble } from 'components/Tokens/loading'
import { ForwardedRef, PropsWithChildren, forwardRef } from 'react'
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

    return (
      <Flex
        row
        overflow="hidden"
        $platform-web={{
          fontVariantNumeric: 'lining-nums tabular-nums',
        }}
        data-testid={testId}
        justifyContent={rest.justifyContent ?? 'flex-end'}
        px={rest.px ?? 12}
        py={rest.py ?? (media.lg ? 12 : 16)}
        alignItems={rest.alignItems ?? 'center'}
        ref={ref}
        {...rest}
      >
        {loading ? <LoadingBubble height={16} width="75%" data-testid="cell-loading-bubble" /> : children}
      </Flex>
    )
  },
)

Cell.displayName = 'Cell'

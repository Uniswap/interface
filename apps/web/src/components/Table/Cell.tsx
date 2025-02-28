import { LoadingBubble } from 'components/Tokens/loading'
import { PropsWithChildren } from 'react'
import { Flex, FlexProps } from 'ui/src'

export function Cell({
  loading,
  children,
  testId,
  ...rest
}: PropsWithChildren<
  {
    loading?: boolean
    testId?: string
  } & Partial<FlexProps>
>) {
  return (
    <Flex
      row
      overflow="hidden"
      $platform-web={{
        fontVariantNumeric: 'lining-nums tabular-nums',
      }}
      data-testid={testId}
      justifyContent={rest.justifyContent ?? 'flex-end'}
      px={rest.px ?? 8}
      py={rest.py ?? 12}
      alignItems={rest.alignItems ?? 'center'}
      {...rest}
    >
      {loading ? <LoadingBubble height={16} width="75%" data-testid="cell-loading-bubble" /> : children}
    </Flex>
  )
}

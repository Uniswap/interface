import { LoadingBubble } from 'components/Tokens/loading'
import deprecatedStyled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { Flex, FlexProps } from 'ui/src'

const LoadingDataBubble = deprecatedStyled(LoadingBubble)`
  width: 75%;
  height: 16px;
`
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
      {loading ? <LoadingDataBubble data-testid="cell-loading-bubble" /> : children}
    </Flex>
  )
}

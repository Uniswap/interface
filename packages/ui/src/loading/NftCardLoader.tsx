import { Flex, FlexProps } from 'ui/src/components/layout'

export function NftCardLoader({ ...props }: FlexProps): JSX.Element {
  return (
    <Flex fill justifyContent="flex-start" m="$spacing4" {...props}>
      <Flex aspectRatio={1} backgroundColor="$neutral3" borderRadius="$rounded12" width="100%" />
    </Flex>
  )
}

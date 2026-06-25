import { Flex, type FlexProps } from 'ui/src'

export function PortfolioPoolsSidebarCard({ children, ...props }: FlexProps): JSX.Element {
  return (
    <Flex
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      p="$spacing20"
      width="100%"
      $xl={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}
      $md={{ flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }}
      {...props}
    >
      {children}
    </Flex>
  )
}

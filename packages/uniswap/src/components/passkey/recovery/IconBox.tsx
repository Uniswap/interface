import type { ReactNode } from 'react'
import { type ColorTokens, Flex } from 'ui/src'

export function IconBox({ children, background }: { children: ReactNode; background?: ColorTokens }): JSX.Element {
  return (
    <Flex
      p="$spacing12"
      backgroundColor={background ?? '$surface3'}
      borderRadius="$rounded12"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Flex>
  )
}

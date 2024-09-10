import { PropsWithChildren } from 'react'
import { ThemedText } from 'theme/components'
import { Flex, Image } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'

export function ModalContent({ title, subtext, children }: PropsWithChildren<{ title: string; subtext: string }>) {
  return (
    <Flex alignItems="center" gap="$spacing32">
      <Flex alignItems="center" gap="$spacing12">
        <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />
        <Flex alignItems="center" gap="$spacing8">
          <ThemedText.H1Medium textAlign="center">{title}</ThemedText.H1Medium>
          <ThemedText.BodySecondary textAlign="center" maxWidth="400px">
            {subtext}
          </ThemedText.BodySecondary>
        </Flex>
      </Flex>
      {children}
    </Flex>
  )
}

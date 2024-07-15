import { ColumnCenter } from 'components/Column'
import { PropsWithChildren } from 'react'
import { ThemedText } from 'theme/components'
import { Image } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'

export function ModalContent({ title, subtext, children }: PropsWithChildren<{ title: string; subtext: string }>) {
  return (
    <ColumnCenter gap="xl">
      <ColumnCenter gap="md">
        <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />
        <ColumnCenter gap="sm">
          <ThemedText.H1Medium textAlign="center">{title}</ThemedText.H1Medium>
          <ThemedText.BodySecondary textAlign="center" maxWidth="400px">
            {subtext}
          </ThemedText.BodySecondary>
        </ColumnCenter>
      </ColumnCenter>
      {children}
    </ColumnCenter>
  )
}

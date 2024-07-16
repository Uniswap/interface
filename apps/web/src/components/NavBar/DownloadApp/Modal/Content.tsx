import { ColumnCenter } from 'components/Column'
import { MobileAppLogo } from 'components/Icons/MobileAppLogo'
import { PropsWithChildren } from 'react'
import { ThemedText } from 'theme/components'

export function ModalContent({ title, subtext, children }: PropsWithChildren<{ title: string; subtext: string }>) {
  return (
    <ColumnCenter gap="xl">
      <ColumnCenter gap="md">
        <MobileAppLogo width={64} height={64} />
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

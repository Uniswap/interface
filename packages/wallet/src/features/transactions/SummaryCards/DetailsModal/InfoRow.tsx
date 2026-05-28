import { PropsWithChildren } from 'react'
import { Flex } from 'ui/src'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'

export function InfoRow({
  label,
  children,
}: PropsWithChildren & {
  label: string
}): JSX.Element {
  return (
    <ContentRow label={label} variant="body3">
      <Flex centered row gap="$spacing4">
        {children}
      </Flex>
    </ContentRow>
  )
}

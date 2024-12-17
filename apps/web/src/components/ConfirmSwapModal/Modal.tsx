import { InterfaceModalName } from '@uniswap/analytics-events'
import { AutoColumn } from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { AdaptiveWebModal, HeightAnimator } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'

const Content = styled(AutoColumn)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: 8px;
  gap: 12px;
`

export function SwapModal({
  children,
  onDismiss,
}: PropsWithChildren<{
  onDismiss: () => void
}>) {
  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <AdaptiveWebModal isOpen onClose={onDismiss} maxHeight="90vh" p={0}>
        <HeightAnimator
          open={true}
          width="100%"
          minWidth="min-content"
          overflow="hidden"
          borderRadius="$rounded20"
          backgroundColor="$surface1"
          $md={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <Content>{children}</Content>
        </HeightAnimator>
      </AdaptiveWebModal>
    </Trace>
  )
}

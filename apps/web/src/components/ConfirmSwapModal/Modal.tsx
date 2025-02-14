import { InterfaceModalName } from '@uniswap/analytics-events'
import { AutoColumn } from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
      <Modal name={ModalName.SwapReview} isModalOpen onClose={onDismiss} padding={0}>
        <Content>{children}</Content>
      </Modal>
    </Trace>
  )
}

import styled from 'lib/theme'
import { StyledButton, styledIcon } from 'lib/theme/components'
import Layer from 'lib/theme/layer'
import { createContext, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'react-feather'

import Header from './Header'

const Context = createContext<HTMLDivElement | null>(null)

export const Provider = Context.Provider

const StyledXIcon = styledIcon(X, 'primary')

interface DialogHeaderProps {
  title?: string
  onClose?: () => void
  children: ReactNode
}

export function DialogHeader({ title, onClose, children }: DialogHeaderProps) {
  return (
    <Header title={title} divider>
      {children}
      {onClose && (
        <StyledButton onClick={onClose}>
          <StyledXIcon />
        </StyledButton>
      )}
    </Header>
  )
}

export const Modal = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  height: calc(100% - 0.5em);
  left: 0;
  margin: 0.25em;
  overflow: clip;
  position: absolute;
  top: 0;
  width: calc(100% - 0.5em);
  z-index: ${Layer.DIALOG};
`

export const DialogBody = styled.div`
  height: calc(100% - 5em - 2px);
  overflow-y: scroll;
  padding: 1em;
`

interface DialogProps {
  children: ReactNode
}

export default function Dialog({ children }: DialogProps) {
  const modal = useContext(Context)
  return modal && createPortal(<Modal>{children}</Modal>, modal)
}

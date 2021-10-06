import { createContext, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'

import themed from '../../themed'

const Context = createContext<HTMLDivElement | null>(null)

export const Provider = Context.Provider

const Wrapper = themed.div`
  background-color: ${({ theme }) => theme.bg1};
  border-radius: ${({ theme }) => Math.max(theme.borderRadius - 4, 0)}px;
  box-sizing: border-box;
  height: calc(100% - 8px);
  left: 0;
  margin: 4px;
  position: absolute;
  top: 0;
  width: calc(100% - 8px);
  z-index: 1;
`

interface ModalProps {
  backgroundColor?: string
  children: ReactNode
}

export default function Modal({ backgroundColor, children }: ModalProps) {
  const div = useContext(Context)
  if (!div) {
    return null
  }

  return createPortal(<Wrapper style={{ backgroundColor }}>{children}</Wrapper>, div)
}

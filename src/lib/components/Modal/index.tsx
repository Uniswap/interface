import { createContext, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'

import themed, { useTheme } from '../../themed'

export { default as Header } from './Header'

const Context = createContext<HTMLDivElement | null>(null)

export const Provider = Context.Provider

const Wrapper = themed.div`
  border-radius: ${({ theme }) => Math.max(theme.borderRadius - 4, 0)}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100% - 8px);
  left: 0;
  margin: 4px;
  padding: 8px;
  position: absolute;
  top: 0;
  width: calc(100% - 8px);
  z-index: 1;
`

export const Body = themed.div`
  padding-top: 8px;
  overflow-y: scroll;
`

interface ModalProps {
  backgroundColor?: string
  children: ReactNode
}

export default function Modal({ backgroundColor, children }: ModalProps) {
  const modal = useContext(Context)
  const { modalBg } = useTheme()
  backgroundColor = backgroundColor ?? modalBg
  return modal && createPortal(<Wrapper style={{ backgroundColor }}>{children}</Wrapper>, modal)
}

export function Alert({ children }: ModalProps) {
  const { alertBg } = useTheme()
  return <Modal backgroundColor={alertBg}>{children}</Modal>
}

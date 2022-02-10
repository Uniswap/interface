import 'wicg-inert'

import useUnmount from 'lib/hooks/useUnmount'
import { X } from 'lib/icons'
import styled, { Color, Layer, ThemeProvider } from 'lib/theme'
import { createContext, ReactElement, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from './Button'
import Column from './Column'
import { default as BaseHeader } from './Header'
import Rule from './Rule'

// Include inert from wicg-inert
declare global {
  interface HTMLElement {
    inert?: boolean
  }
}

const Context = createContext({
  element: null as HTMLElement | null,
  active: false,
  setActive: (active: boolean) => undefined as void,
})

interface ProviderProps {
  value: HTMLElement | null
  children: ReactNode
}

export function Provider({ value, children }: ProviderProps) {
  // If a Dialog is active, mark the main content inert
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const context = { element: value, active, setActive }
  useEffect(() => {
    if (ref.current) {
      ref.current.inert = active
    }
  }, [active])
  return (
    <div ref={ref}>
      <Context.Provider value={context}>{children}</Context.Provider>
    </div>
  )
}

const OnCloseContext = createContext<() => void>(() => void 0)

interface HeaderProps {
  title?: ReactElement
  ruled?: boolean
  children?: ReactNode
}

export function Header({ title, children, ruled }: HeaderProps) {
  return (
    <>
      <Column>
        <BaseHeader title={title}>
          {children}
          <IconButton color="primary" onClick={useContext(OnCloseContext)} icon={X} />
        </BaseHeader>
        {ruled && <Rule padded />}
      </Column>
    </>
  )
}

export const Modal = styled.div<{ color: Color }>`
  background-color: ${({ color, theme }) => theme[color]};
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  overflow: hidden;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: ${Layer.DIALOG};
`

interface DialogProps {
  color: Color
  children: ReactNode
  onClose?: () => void
}

export default function Dialog({ color, children, onClose = () => void 0 }: DialogProps) {
  const context = useContext(Context)
  useEffect(() => {
    context.setActive(true)
    return () => context.setActive(false)
  }, [context])
  const dialog = useRef<HTMLDivElement>(null)
  useUnmount(dialog)
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', close, true)
    return () => document.removeEventListener('keydown', close, true)
  }, [onClose])
  return (
    context.element &&
    createPortal(
      <ThemeProvider>
        <Modal color={color} ref={dialog}>
          <OnCloseContext.Provider value={onClose}>{children}</OnCloseContext.Provider>
        </Modal>
      </ThemeProvider>,
      context.element
    )
  )
}

import 'wicg-inert'

import { X } from 'lib/icons'
import styled, { Color, Layer, ThemeProvider } from 'lib/theme'
import { createContext, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
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

const Context = createContext<HTMLDivElement | null>(null)

interface ProviderProps {
  value: HTMLDivElement | null
  children: ReactNode
}

export function Provider({ value, children }: ProviderProps) {
  // When the Dialog is in use, mark the main content inert
  const ref = useRef<HTMLDivElement>(null)
  const onMutation = useCallback(() => {
    if (ref.current) {
      ref.current.inert = value?.hasChildNodes()
    }
  }, [value])
  const observer = useMemo(() => new MutationObserver(onMutation), [onMutation])
  useEffect(() => {
    if (value) {
      observer.observe(value, { childList: true })
    }
    return () => observer.disconnect()
  }, [observer, value])

  return (
    <div ref={ref}>
      <Context.Provider value={value}>{children}</Context.Provider>
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
      <Column gap={0.75}>
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
  height: calc(100% - 0.5em);
  left: 0;
  margin: 0.25em;
  overflow: hidden;
  position: absolute;
  top: 0;
  width: calc(100% - 0.5em);
  z-index: ${Layer.DIALOG};
`

interface DialogProps {
  color: Color
  children: ReactNode
  onClose?: () => void
}

export default function Dialog({ color, children, onClose = () => void 0 }: DialogProps) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', close, true)
    return () => document.removeEventListener('keydown', close, true)
  }, [onClose])
  const modal = useContext(Context)
  return (
    modal &&
    createPortal(
      <ThemeProvider>
        <Modal color={color}>
          <OnCloseContext.Provider value={onClose}>{children}</OnCloseContext.Provider>
        </Modal>
      </ThemeProvider>,
      modal
    )
  )
}

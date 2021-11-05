import styled, { Color, icon, OriginalProvider as OriginalThemeProvider, Theme } from 'lib/theme'
import Layer from 'lib/theme/layer'
import { createContext, ReactNode, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'react-feather'

import Button from './Button'
import Column from './Column'
import { default as BaseHeader } from './Header'
import Rule from './Rule'

const Context = createContext<HTMLDivElement | null>(null)
export const Provider = Context.Provider

const OnCloseContext = createContext<() => void>(() => void 0)

const XIcon = icon(X, { color: 'primary' })

interface HeaderProps {
  title?: string
  ruled?: boolean
  children?: ReactNode
}

export function Header({ title, children, ruled }: HeaderProps) {
  return (
    <>
      <Column gap={0.75}>
        <BaseHeader title={title}>
          {children}
          <Button onClick={useContext(OnCloseContext)}>
            <XIcon />
          </Button>
        </BaseHeader>
        {ruled && <Rule padded />}
      </Column>
    </>
  )
}

export const Modal = styled.div<{ color: Color; theme: Theme }>`
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
      <OriginalThemeProvider>
        <Modal color={color}>
          <OnCloseContext.Provider value={onClose}>{children}</OnCloseContext.Provider>
        </Modal>
      </OriginalThemeProvider>,
      modal
    )
  )
}

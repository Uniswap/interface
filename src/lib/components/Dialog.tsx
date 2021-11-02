import styled, { Color, icon, OriginalProvider as OriginalThemeProvider, Theme } from 'lib/theme'
import Layer from 'lib/theme/layer'
import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react'
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
      <Column gap={1}>
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

export const Footer = styled(Column)`
  background-color: currentColor;
  border-radius: ${({ theme }) => theme.borderRadius}em;
  bottom: 0;
  position: sticky;
  z-index: ${Layer.OVERLAY};

  :after {
    background-color: inherit;
    bottom: -1em;
    content: '';
    height: 2em;
    position: absolute;
    width: 100%;
    z-index: -1;
  }
`

export const Modal = styled.div<{ color: Color; theme: Theme }>`
  background-color: ${({ color, theme }) => theme[color]};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  display: flex;
  flex-direction: column;
  height: calc(100% - 0.5em);
  left: 0;
  margin: 0.25em;
  position: absolute;
  top: 0;
  width: calc(100% - 0.5em);
  z-index: ${Layer.DIALOG};
`

interface DialogProps {
  color: Color
  children: ReactNode
  onClose: () => void
}

export default function Dialog({ color, children, onClose }: DialogProps) {
  const onKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    },
    [onClose]
  )
  useEffect(
    () => (
      document.addEventListener('keydown', onKeydown, true),
      () => document.removeEventListener('keydown', onKeydown, true)
    )
  )
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

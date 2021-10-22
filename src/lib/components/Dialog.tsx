import styled, { Color, icon, Theme } from 'lib/theme'
import Layer from 'lib/theme/layer'
import { createContext, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'react-feather'

import Button from './Button'
import { default as BaseHeader } from './Header'
import Rule from './Rule'

const Context = createContext<HTMLDivElement | null>(null)

export const Provider = Context.Provider

const XIcon = icon(X, { color: 'primary' })

interface HeaderProps {
  title?: string
  onClose?: () => void
  ruled?: boolean
  children?: ReactNode
}

export function Header({ title, onClose, children, ruled }: HeaderProps) {
  return (
    <>
      <BaseHeader title={title}>
        {children}
        {onClose && (
          <Button onClick={onClose}>
            <XIcon />
          </Button>
        )}
      </BaseHeader>
      {ruled && <Rule padded style={{ marginTop: 'calc(1em - 1px)' }} />}
    </>
  )
}

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
}

export default function Dialog({ color, children }: DialogProps) {
  const modal = useContext(Context)
  return modal && createPortal(<Modal color={color}>{children}</Modal>, modal)
}

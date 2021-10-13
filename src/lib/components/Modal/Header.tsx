import { ThemedButton, themedIcon } from 'lib/themed/components'
import { ReactNode } from 'react'
import { X } from 'react-feather'

import BaseHeader from '../Header'

const ThemedXIcon = themedIcon(X, 'text')

export interface HeaderProps {
  title: ReactNode
  onClose: () => void
  children?: ReactNode
}

export default function Header({ title, onClose, children }: HeaderProps) {
  return (
    <BaseHeader title={title} divider>
      {children}
      {onClose && (
        <ThemedButton onClick={onClose}>
          <ThemedXIcon />
        </ThemedButton>
      )}
    </BaseHeader>
  )
}

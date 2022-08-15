import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.body)

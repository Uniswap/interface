import { createPortal } from 'react-dom'
import { ReactNode } from 'react'

export const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.body)

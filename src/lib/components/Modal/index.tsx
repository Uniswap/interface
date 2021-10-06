import { createContext, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'

import themed from '../../themed'

const Context = createContext<HTMLDivElement | null>(null)

export const Provider = Context.Provider

const Wrapper = themed.div`
  background-color: ${({ theme }) => theme.modal};
  border-radius: 12px;
  box-sizing: border-box;
  height: calc(100% - 8px);
  left: 0;
  margin: 4px;
  position: absolute;
  top: 0;
  width: calc(100% - 8px);
  z-index: 1;
`

export default function Modal({ children }: { children: ReactNode }) {
  const div = useContext(Context)
  if (!div) {
    return null
  }

  return createPortal(<Wrapper>{children}</Wrapper>, div)
}

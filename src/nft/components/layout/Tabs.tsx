import React, {
  cloneElement,
  createContext,
  HTMLAttributes,
  isValidElement,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

function useConstant<T>(fn: () => T): T {
  const ref = React.useRef<{ v: T }>()

  if (!ref.current) ref.current = { v: fn() }

  return ref.current.v
}

const TabsState = createContext<[number, (n: number) => void]>([0, () => void 0])
const Elements = createContext<{ tabs: React.ReactNode[]; panels: React.ReactNode[] }>({
  tabs: [],
  panels: [],
})

export const Tabs = ({
  state: outerState,
  children,
}: {
  children: ReactNode
  state?: [number, (n: number) => void]
}) => {
  const innerState = useState(1)
  const state = outerState || innerState
  const defaultElements = useConstant(() => ({ tabs: [], panels: [] }))

  return (
    <Elements.Provider value={defaultElements}>
      <TabsState.Provider value={state}>{children}</TabsState.Provider>
    </Elements.Provider>
  )
}

export const useTabState = (children: React.ReactNode) => {
  const [activeIndex, setActive] = useContext(TabsState)
  const elements = useContext(Elements)

  const tabIndex = useConstant(() => {
    const isChildrenUnique = !elements.tabs.includes(children)
    if (isChildrenUnique) elements.tabs.push(children)

    return isChildrenUnique ? elements.tabs.length : elements.tabs.indexOf(children)
  })

  const onClick = useConstant(() => () => setActive(tabIndex))

  const state = useMemo(
    () => ({
      isActive: activeIndex === tabIndex,
      onClick,
    }),
    [activeIndex, onClick, tabIndex]
  )

  return state
}

export const usePanelState = (children: React.ReactNode) => {
  const [activeIndex] = useContext(TabsState)
  const elements = useContext(Elements)

  const panelIndex = useConstant(() => {
    const isChildrenUnique = !elements.panels.includes(children)
    if (isChildrenUnique) {
      elements.panels.push(children)
    }

    return isChildrenUnique ? elements.panels.length : elements.panels.indexOf(children)
  })

  return panelIndex === activeIndex
}

export const Tab: React.FC<{
  children: React.ReactElement<HTMLAttributes<HTMLElement>, string | React.JSXElementConstructor<HTMLElement>>
}> = ({ children }) => {
  const state = useTabState(children)

  return isValidElement(children)
    ? cloneElement(children as React.ReactElement, {
        onClick: state.onClick,
        'data-active': state.isActive,
      })
    : children
}

export const Panel: React.FC<{ active?: boolean; children: any }> = ({ active, children }) => {
  const isActive = usePanelState(children)

  return isActive || active ? children : null
}

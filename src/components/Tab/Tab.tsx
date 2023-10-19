import { ButtonEmpty } from 'components/Button'
import { createContext, ReactNode, useContext } from 'react'
import { useTheme } from 'styled-components/macro'

interface TabProps {
  label: string
  value: string | number
}

interface TabsContextProps {
  onTabChange: (value: string | number) => void
  activeTab: string | number
}

interface TabsProps {
  value: string | number
  onChange: (value: string | number) => void
  children: ReactNode
}

const TabsContext = createContext<TabsContextProps>({ activeTab: '', onTabChange: () => '' })

function Tabs({ value, onChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, onTabChange: onChange }}>
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </TabsContext.Provider>
  )
}

export function Tab({ label, value }: TabProps) {
  const { activeTab, onTabChange } = useContext(TabsContext)
  const theme = useTheme()

  return (
    <ButtonEmpty
      width="fit-content"
      style={{
        color: value === activeTab ? theme.accentActive : theme.accentAction,
      }}
      onClick={() => onTabChange(value)}
    >
      {label}
    </ButtonEmpty>
  )
}

export default Tabs

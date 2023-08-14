import Tabs, { Tab } from 'components/Tab/Tab'
import styled from 'styled-components/macro'

const CustomTabWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
`

interface tabItem {
  text: string
  id: string
}

interface CustomTabSwitchProps {
  width?: number | string
  height: number
  items: tabItem[]
  selectedItem: tabItem
  handleTabChange: (item: tabItem) => void
}

export default function CustomTabSwitch({ items, selectedItem, handleTabChange }: CustomTabSwitchProps) {
  return (
    <CustomTabWrapper>
      <Tabs
        value={selectedItem?.id}
        onChange={(value) => {
          const itemToSelect = items.find((item) => item.id === value)
          if (itemToSelect) {
            handleTabChange(itemToSelect)
          }
        }}
      >
        {items?.map((_item) => (
          <Tab value={_item?.id} key={_item?.id} label={_item.text} />
        ))}
      </Tabs>
    </CustomTabWrapper>
  )
}

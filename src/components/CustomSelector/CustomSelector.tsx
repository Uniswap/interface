import { Box } from 'rebass'

export interface SelectorItem {
  text: string
  id: number
  link: string
  hasSeparator?: boolean
}

interface CustomSelectorProps {
  height: number
  items: SelectorItem[]
  selectedItem: SelectorItem
  handleChange: (item: SelectorItem) => void
}

export default function CustomSelector({ height, items, selectedItem, handleChange }: CustomSelectorProps) {
  return (
    <Box>
      {items.map((item) => (
        <Box key={item.id} className="flex items-center">
          {item.hasSeparator && <Box mr={1} height={height} className="customSelectorSeparator" />}
          <Box
            height={height}
            className={`customSelector ${item.id === selectedItem.id ? 'selectedCustomSelector' : ''}`}
            onClick={() => {
              handleChange(item)
            }}
          >
            <small>{item.text}</small>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

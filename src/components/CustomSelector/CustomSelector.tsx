import { ButtonEmpty } from 'components/Button'
import { Box } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'

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

const SelectorLayout = styled.div`
  width: 100%;
  display: flex;
`

export default function CustomSelector({ height, items, selectedItem, handleChange }: CustomSelectorProps) {
  const theme = useTheme()

  return (
    <SelectorLayout>
      {items.map((item) => (
        <Box key={item.text} className="flex items-center">
          <ButtonEmpty
            style={{
              color: item.link === selectedItem.link ? theme.accentActive : theme.accentAction,
            }}
            height={height}
            onClick={() => {
              handleChange(item)
            }}
          >
            <small>{item.text}</small>
          </ButtonEmpty>
        </Box>
      ))}
    </SelectorLayout>
  )
}

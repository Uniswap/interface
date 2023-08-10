import { Box } from 'rebass'

interface SwitchItems {
  text: string
  onClick: () => void
  condition: boolean
}

interface CustomSwitchProps {
  width: number | string
  height: number
  items: SwitchItems[]
  isLarge?: boolean
}

export default function CustomSwitch({ width, height, items, isLarge }: CustomSwitchProps) {
  return (
    <Box display="flex" width={width} height={height}>
      {items.map((item, index) => {
        const returnBorderRadius = (ind: number) => {
          return index === ind ? 8 : 0 // this makes border radius for individual switch item
        }
        return (
          <Box
            key={index}
            className={`switchItem${item.condition ? ' activeSwitchItem' : ''}
        `}
            style={{
              // makes left border radius for the first switch item and right border radius for the last switch item
              borderTopLeftRadius: returnBorderRadius(0),
              borderBottomLeftRadius: returnBorderRadius(0),
              borderTopRightRadius: returnBorderRadius(items.length - 1),
              borderBottomRightRadius: returnBorderRadius(items.length - 1),
            }}
            onClick={item.onClick}
          >
            <p className={isLarge ? '' : 'small'}>{item.text}</p>
          </Box>
        )
      })}
    </Box>
  )
}

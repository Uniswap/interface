import React, { ComponentProps } from 'react'
import { Box, Flex, Flex as FlexBase, Inset } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { colorsDark, colorsLight, Palette } from 'src/styles/color'

export function FlexWithChildren(props: ComponentProps<typeof FlexBase>) {
  return (
    <FlexBase {...props}>
      <Box bg="primary1" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="primary2" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="primary3" borderRadius="sm">
        <Inset all="lg" />
      </Box>
      <Box bg="secondary1" borderRadius="sm">
        <Inset all="lg" />
      </Box>
    </FlexBase>
  )
}

export function _Palette(colors: Palette) {
  return () => (
    <Flex gap="none">
      {Object.entries(colors).map(([color, value], i, arr) => (
        <Box
          borderTopLeftRadius={i === 0 || i === arr.length - 1 ? 'sm' : 'none'}
          borderTopRightRadius={i === 0 || i === arr.length - 1 ? 'sm' : 'none'}
          p="sm"
          style={{ backgroundColor: value }}>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="bodySm">{color}</Text>
            <Text variant="bodySm">{value}</Text>
          </Flex>
        </Box>
      ))}
    </Flex>
  )
}

export const PaletteLight = _Palette(colorsLight)
export const PaletteDark = _Palette(colorsDark)

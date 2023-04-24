import React, { ComponentProps } from 'react'
import { Box, Flex, Flex as FlexBase, Inset } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { colorsDark, colorsLight, Palette } from 'src/styles/color'

export function FlexWithChildren(props: ComponentProps<typeof FlexBase>): JSX.Element {
  return (
    <FlexBase {...props}>
      <Box bg="accentAction" borderRadius="rounded8">
        <Inset all="spacing24" />
      </Box>
      <Box bg="accentAction" borderRadius="rounded8" opacity={80}>
        <Inset all="spacing24" />
      </Box>
      <Box bg="accentAction" borderRadius="rounded8" opacity={60}>
        <Inset all="spacing24" />
      </Box>
      <Box bg="accentAction" borderRadius="rounded8" opacity={40}>
        <Inset all="spacing24" />
      </Box>
    </FlexBase>
  )
}

export function _Palette(colors: Palette) {
  return (): JSX.Element => (
    <Flex gap="none">
      {Object.entries(colors).map(([color, value], i, arr) => (
        <Box
          borderTopLeftRadius={i === 0 || i === arr.length - 1 ? 'rounded8' : 'none'}
          borderTopRightRadius={i === 0 || i === arr.length - 1 ? 'rounded8' : 'none'}
          p="spacing12"
          style={{ backgroundColor: value }}>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="buttonLabelMicro">{color}</Text>
            <Text variant="buttonLabelMicro">{value}</Text>
          </Flex>
        </Box>
      ))}
    </Flex>
  )
}

export const PaletteLight = _Palette(colorsLight)
export const PaletteDark = _Palette(colorsDark)

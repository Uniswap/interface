import { useTheme } from '@shopify/restyle'
import React from 'react'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { ElementName } from 'src/features/telemetry/constants'

interface ColorSelectorProps {
  selectedColor?: string
  updateColor: (color: string) => void
}

// TODO: add these colors to theme and reference them as theme.colors.userThemeColor1, userThemeColor2, etc.
const COLORS = ['#FC72FF', '#5065FD', '#FF6F1E', '#B1F13C', '#36DBFF', '#7E887D']

/** Renders color selector for theme update */
export function ColorSelector({ selectedColor, updateColor }: ColorSelectorProps) {
  const theme = useTheme()

  const renderItem = ({ item: color }: ListRenderItemInfo<string>) => (
    <Button
      borderRadius="full"
      borderWidth={1}
      name={ElementName.SelectColor + '-' + color}
      padding="xs"
      style={{
        backgroundColor: theme.colors.neutralSurface,
        borderColor: selectedColor === color ? color : theme.colors.none,
      }}
      testID={ElementName.SelectColor + '-' + color}
      onPress={() => updateColor(color)}>
      <Box borderRadius="full" height={22} style={{ backgroundColor: color }} width={22} />
    </Button>
  )

  return (
    <FlatList
      columnWrapperStyle={ColumnStyle.base}
      data={COLORS}
      keyExtractor={(color) => color}
      numColumns={6}
      renderItem={renderItem}
    />
  )
}

const ColumnStyle = StyleSheet.create({
  base: {
    justifyContent: 'space-between',
  },
})

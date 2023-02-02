import React, { useReducer } from 'react'
import { StyleSheet } from 'react-native'
import { Flex } from 'src/components/layout'
import { colors } from 'src/styles/color'
import { useInterval } from 'src/utils/timing'

const possibleColors = [
  colors.red300,
  colors.orange300,
  colors.yellow200,
  colors.green300,
  colors.blue300,
  colors.violet300,
]

export const SimulatedViewfinder = (): JSX.Element => {
  const [index, increment] = useReducer((state) => (state + 1) % possibleColors.length, 0)
  const color = possibleColors[index]
  useInterval(increment, 1000)

  return <Flex style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
}

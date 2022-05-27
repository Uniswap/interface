import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'
import { Flex } from 'src/components/layout'

interface NativeMnemonicDisplayProps {
  address: Address
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

export function MnemonicDisplay(props: MnemonicDisplayProps) {
  return (
    <Flex height={300} justifyContent="space-between" mx="xl" my="lg">
      <NativeMnemonicDisplay {...props} />
    </Flex>
  )
}

import React from 'react'
import { Image } from 'react-native'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { getNetworkColors } from 'src/utils/colors'

interface NetworkLabelProps {
  chainId: ChainId
  showBorder?: boolean
}

export function NetworkLabel({ chainId, showBorder = false }: NetworkLabelProps) {
  const info = CHAIN_INFO[chainId]
  const colors = getNetworkColors(chainId)

  return (
    <CenterBox
      backgroundColor="gray200"
      borderRadius="full"
      borderWidth={1}
      borderColor="none"
      px="md"
      py="xs"
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        backgroundColor: colors?.background,
        borderColor: showBorder ? colors?.foreground : 'transparent',
      }}>
      {info.logoUrl && <Image source={{ uri: info.logoUrl }} height={40} width={40} />}
      <Text variant="body" style={{ color: colors?.foreground ?? 'black' }}>
        {info.label}
      </Text>
    </CenterBox>
  )
}

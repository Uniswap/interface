import React from 'react'
import { Image } from 'react-native'
import { Pill } from 'src/components/text/Pill'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'

interface NetworkLabelProps {
  chainId: ChainId
  showBorder?: boolean
}

export function NetworkLabel({ chainId, showBorder = false }: NetworkLabelProps) {
  const info = CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      backgroundColor={colors?.background}
      borderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      icon={info.logoUrl && <Image source={{ uri: info.logoUrl }} height={40} width={40} />}
      label={info.label}
    />
  )
}

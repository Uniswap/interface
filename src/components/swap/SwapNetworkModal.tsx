import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box } from 'src/components/layout/Box'
import { NetworkButtonGroup, NetworkButtonType } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface SwapNetworkModalProps {
  chainId?: ChainId
  setChainId: (chainId: ChainId) => void
  onPressClose: () => void
}

export function SwapNetworkModal({ chainId, setChainId, onPressClose }: SwapNetworkModalProps) {
  const { t } = useTranslation()

  return (
    <Box justifyContent="space-between" py="lg">
      <Box alignItems="center" justifyContent="space-between">
        <Text variant="h5">{t('Select Network')}</Text>
        <NetworkButtonGroup
          selected={chainId ?? 0}
          type={NetworkButtonType.BOX}
          onPress={(newChainId) => {
            setChainId(newChainId)
            onPressClose()
          }}
        />
      </Box>
      <TextButton
        alignSelf="center"
        my="md"
        textColor="blue"
        textVariant="h4"
        onPress={onPressClose}>
        {t('Close')}
      </TextButton>
    </Box>
  )
}

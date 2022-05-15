import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { NetworkButtonGroup, NetworkButtonType } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface ChangeNetworkModalProps {
  chainId?: ChainId
  setChainId: (chainId: ChainId) => void
  onPressClose: () => void
}

export function ChangeNetworkModal({ chainId, setChainId, onPressClose }: ChangeNetworkModalProps) {
  const { t } = useTranslation()

  return (
    <Flex centered gap="lg" mb="md" p="md">
      <Text variant="mediumLabel">{t('Select Network')}</Text>
      <NetworkButtonGroup
        selected={chainId ?? null}
        type={NetworkButtonType.BOX}
        onPress={(newChainId) => {
          setChainId(newChainId)
          onPressClose()
        }}
      />
      <TextButton
        alignSelf="center"
        textColor="deprecated_blue"
        textVariant="mediumLabel"
        onPress={onPressClose}>
        {t('Close')}
      </TextButton>
    </Flex>
  )
}

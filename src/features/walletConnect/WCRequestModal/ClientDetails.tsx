import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappInfo, EthMethod } from 'src/features/walletConnect/types'

const DAPP_IMAGE_SIZE = 48
export function ClientDetails({ dapp, method }: { dapp: DappInfo; method: EthMethod }) {
  const { t } = useTranslation()

  const getReadableMethodName = (ethMethod: EthMethod) => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
        return t('Signature request from')
    }

    return t('Request from')
  }

  return (
    <Flex centered gap="md">
      <Image source={{ uri: dapp.icon, height: DAPP_IMAGE_SIZE, width: DAPP_IMAGE_SIZE }} />
      <Flex centered gap="none">
        <Text variant="bodyLg">{getReadableMethodName(method)}</Text>
        <Text variant="bodyLgBold">{dapp.name}</Text>
        <LinkButton mt="xs" textColor="blue" url={dapp.url}>
          {dapp.url}
        </LinkButton>
      </Flex>
    </Flex>
  )
}

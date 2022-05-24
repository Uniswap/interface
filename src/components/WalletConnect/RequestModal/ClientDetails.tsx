import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { DappInfo, EthMethod } from 'src/features/walletConnect/types'
import { toSupportedChainId } from 'src/utils/chainId'

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
  const chainId = toSupportedChainId(dapp.chain_id) ?? ChainId.Mainnet
  return (
    <Flex centered gap="md">
      <Flex row alignItems="center" gap="md">
        <Image source={{ uri: dapp.icon, height: DAPP_IMAGE_SIZE, width: DAPP_IMAGE_SIZE }} />
        <Box bottom={0} position="absolute" right={8}>
          <NetworkLogo chainId={chainId} size={20} />
        </Box>
      </Flex>
      <Flex centered gap="none">
        <Text variant="subHead1">{getReadableMethodName(method)}</Text>
        <Text fontWeight="bold" textAlign="center" variant="subHead1">
          {dapp.name}
        </Text>
        <LinkButton mt="xs" textColor="deprecated_blue" url={dapp.url}>
          {dapp.url}
        </LinkButton>
      </Flex>
    </Flex>
  )
}

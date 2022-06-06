import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useENS } from 'src/features/ens/useENS'
import { EthMethod } from 'src/features/walletConnect/types'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

const getStrMessage = (request: WalletConnectRequest) => {
  if (request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign) {
    return request.message || request.rawMessage
  }

  if (
    request.type === EthMethod.EthSignTransaction ||
    request.type === EthMethod.EthSendTransaction
  ) {
    return request.transaction.data
  }

  return ''
}

const AddressButton = ({ address, chainId }: { address: string; chainId: number }) => {
  const { name } = useENS(chainId, address, false)
  return (
    <Button
      backgroundColor="neutralContainer"
      borderRadius="xs"
      px="md"
      py="xxs"
      onPress={() => openUri(getExplorerLink(chainId, address, ExplorerDataType.ADDRESS))}>
      <Flex row alignItems="center" gap="xs">
        <Text variant="body2">{name || shortenAddress(address)}</Text>
        <ExternalLinkIcon height={14} width={14} />
      </Flex>
    </Button>
  )
}

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0): any => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="body2">...</Text>
  }

  return (
    <Flex gap="xxs">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <Flex gap="xxs">
              <Text color="accentText2" style={{ marginLeft: depth * 10 }} variant="body2">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex row alignItems="center" gap="xs" style={{ marginLeft: depth * 10 }}>
              <Text color="accentText2">{objKey}</Text>
              <Flex flexShrink={1}>
                {isValidAddress(childValue, true) ? (
                  <AddressButton address={childValue} chainId={chainId} />
                ) : (
                  <Text variant="body2">{childValue}</Text>
                )}
              </Flex>
            </Flex>
          )
        }

        // TODO: handle array child types
        return null
      })}
    </Flex>
  )
}

type Props = {
  request: WalletConnectRequest
}

function RequestMessageContent({ request }: Props) {
  if (request.type === EthMethod.SignTypedData) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay(request.dapp.chain_id, data.message, 0)
    } catch (e) {
      logger.error('WalletConnectRequestModal', 'getMessage', 'invalid JSON message', e)
      return <Text>{''}</Text>
    }
  }

  return <Text variant="body1">{getStrMessage(request)}</Text>
}

export function RequestMessage({ request }: Props) {
  const { t } = useTranslation()

  return (
    <ScrollView>
      <Flex p="md">
        <Text variant="caption">{t('Message')}</Text>
        <RequestMessageContent request={request} />
      </Flex>
    </ScrollView>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { EthMethod } from 'src/features/walletConnect/types'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
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

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
const getParsedObjectDisplay = (obj: any, depth = 0): any => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="body2">...</Text>
  }

  return (
    <>
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <>
              <Text color="accentText2" style={{ marginLeft: depth * 10 }} variant="body2">
                {objKey}
              </Text>
              {getParsedObjectDisplay(childValue, depth + 1)}
            </>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex row alignItems="flex-start" gap="xs" style={{ marginLeft: depth * 10 }}>
              <Text color="accentText2">{objKey}</Text>
              <Flex flexShrink={1}>
                <Text variant="body2">{childValue}</Text>
              </Flex>
            </Flex>
          )
        }

        // TODO: handle array child types
        return null
      })}
    </>
  )
}

type Props = {
  request: WalletConnectRequest
}

function RequestMessageContent({ request }: Props) {
  if (request.type === EthMethod.SignTypedData) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay(data.message, 0)
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

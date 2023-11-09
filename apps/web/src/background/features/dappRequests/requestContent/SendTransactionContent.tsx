import { selectDappChainId } from 'src/background/features/dapp/selectors'
import { SendTransactionRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { useAppSelector } from 'src/background/store'
import { Flex, Text } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { useTransactionGasFee, useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

export const SendTransactionDetails = ({
  request,
  dappUrl,
}: {
  request: DappRequestStoreItem
  dappUrl: string
}): JSX.Element => {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const sendTransactionRequest = request.dappRequest as SendTransactionRequest

  const sending = sendTransactionRequest.transaction.value
  const toAddress = sendTransactionRequest.transaction.to

  const chainId = useAppSelector(selectDappChainId(dappUrl))

  const networkFee = useTransactionGasFee({
    chainId,
    ...sendTransactionRequest.transaction,
  }).value
  const gasFeeUSD = useUSDValue(chainId, networkFee)

  const contractFunction = sendTransactionRequest.transaction.type
  return (
    <Flex>
      <Flex
        bg="$surface2"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        m="$none"
        px="$spacing16"
        py="$spacing12">
        <Flex row justifyContent="space-between">
          <Text color="$neutral2" variant="body2">
            Sending
          </Text>
          <Flex row gap="$spacing4">
            <Text textAlign="right" variant="subheading2">
              {sending}
            </Text>
          </Flex>
        </Flex>

        <Flex row justifyContent="space-between">
          <Text color="$neutral2" variant="body2">
            To
          </Text>
          <Flex row gap="$spacing4">
            <Text textAlign="right" variant="body2">
              {toAddress?.substring(0, 10)}...
            </Text>
          </Flex>
        </Flex>
        {contractFunction ? (
          <Flex row justifyContent="space-between">
            <Text color="$neutral2" variant="body2">
              Function
            </Text>
            <Flex row gap="$spacing4">
              <Text textAlign="right" variant="body2">
                {contractFunction}
              </Text>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
      <Flex bg="$surface2" borderBottomLeftRadius="$rounded16" borderBottomRightRadius="$rounded16">
        <Flex
          row
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          px="$spacing16"
          py="$spacing12"
          width="100%">
          <Text color="$neutral2" variant="body2">
            Network fee
          </Text>
          <Text color="$neutral2" textAlign="right" variant="body2">
            {convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

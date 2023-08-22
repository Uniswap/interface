import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { SendTransactionRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { useAppSelector } from 'src/background/store'
import { Text, XStack, YStack } from 'ui/src'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useTransactionGasFee, useUSDValue } from 'wallet/src/features/gas/hooks'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export const SendTransactionDetails = ({
  activeAccount,
  request,
  dappUrl,
}: {
  activeAccount: Account

  request: DappRequestStoreItem
  dappUrl: string
}): JSX.Element => {
  const sendTransactionRequest = request.dappRequest as SendTransactionRequest

  const sending = sendTransactionRequest.transaction.value
  const toAddress = sendTransactionRequest.transaction.to

  const chainId = useAppSelector(selectChainByDappAndWallet(activeAccount.address, dappUrl))

  const networkFee = useTransactionGasFee({
    chainId,
    ...sendTransactionRequest.transaction,
  }).data?.gasFee
  const gasFeeUSD = useUSDValue(chainId, networkFee)

  const contractFunction = sendTransactionRequest.transaction.type
  return (
    <YStack>
      <YStack
        backgroundColor="$surface2"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        margin="$none"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12">
        <XStack justifyContent="space-between">
          <Text color="$neutral2" variant="bodySmall">
            Sending
          </Text>
          <XStack gap="$spacing4">
            <Text textAlign="right" variant="subheadSmall">
              {sending}
            </Text>
          </XStack>
        </XStack>

        <XStack justifyContent="space-between">
          <Text color="$neutral2" variant="bodySmall">
            To
          </Text>
          <XStack gap="$spacing4">
            <Text textAlign="right" variant="bodySmall">
              {toAddress?.substring(0, 10)}...
            </Text>
          </XStack>
        </XStack>
        {contractFunction ? (
          <XStack justifyContent="space-between">
            <Text color="$neutral2" variant="bodySmall">
              Function
            </Text>
            <XStack gap="$spacing4">
              <Text textAlign="right" variant="bodySmall">
                {contractFunction}
              </Text>
            </XStack>
          </XStack>
        ) : null}
      </YStack>
      <YStack
        backgroundColor="$surface2"
        borderBottomLeftRadius="$rounded16"
        borderBottomRightRadius="$rounded16">
        <XStack
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          width="100%">
          <Text color="$neutral2" variant="bodySmall">
            Network fee
          </Text>
          <Text color="$neutral2" textAlign="right" variant="bodySmall">
            {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
          </Text>
        </XStack>
      </YStack>
    </YStack>
  )
}

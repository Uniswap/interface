import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { SendTransactionRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { AddressFooter } from 'src/background/features/dappRequests/requestContent/AddressFooter'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { useAppSelector } from 'src/background/store'
import { Text, XStack, YStack } from 'ui/src'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
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

  //TODO(EXT-157): convert to USD
  const networkFee = useTransactionGasFee({
    chainId,
    ...sendTransactionRequest.transaction,
  })?.gasFee

  const contractFunction = sendTransactionRequest.transaction.type
  return (
    <YStack>
      <YStack
        backgroundColor="$backgroundScrim"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        margin="$none"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12">
        <XStack justifyContent="space-between">
          <Text color="$textSecondary" variant="bodySmall">
            Sending
          </Text>
          <XStack gap="$spacing4">
            <Text textAlign="right" variant="subheadSmall">
              {sending}
            </Text>
          </XStack>
        </XStack>

        <XStack justifyContent="space-between">
          <Text color="$textSecondary" variant="bodySmall">
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
            <Text color="$textSecondary" variant="bodySmall">
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
        backgroundColor="$backgroundScrim"
        borderBottomLeftRadius="$rounded16"
        borderBottomRightRadius="$rounded16">
        <XStack
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          width="100%">
          <Text color="$textSecondary" variant="bodySmall">
            Network fee
          </Text>
          <Text color="$textSecondary" textAlign="right" variant="bodySmall">
            {networkFee}
          </Text>
        </XStack>
        <AddressFooter account={activeAccount} />
      </YStack>
    </YStack>
  )
}

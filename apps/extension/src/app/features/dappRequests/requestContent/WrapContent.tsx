import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useGasFeeFormattedDisplayAmounts, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

export const WrapTransactionDetails = ({
  request,
  dappUrl,
}: {
  request: DappRequestStoreItem
  dappUrl: string
}): JSX.Element => {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const activeAddress = useActiveAccountAddressWithThrow()
  const displayName = useDisplayName(activeAddress)

  const sendTransactionRequest = request.dappRequest as SendTransactionRequest

  const chainId = useDappLastChainId(dappUrl) || defaultChainId

  const txRequest = useMemo(
    () => ({ ...sendTransactionRequest.transaction, chainId }),
    [sendTransactionRequest, chainId],
  )

  const networkFee = useTransactionGasFee(txRequest)

  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee: networkFee,
    chainId,
    placeholder: undefined,
  })

  return (
    <Flex>
      <Flex
        backgroundColor="$surface2"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        m="$none"
        px="$spacing16"
        py="$spacing12"
      >
        {/* TODO: MOB-2529: fix string translation */}
        <Flex row justifyContent="space-between">
          <Text color="$neutral2" variant="body2">
            {'<wrapType>'}
          </Text>
          <Flex row gap="$spacing4">
            <Text textAlign="right" variant="subheading2">
              {/* {paying} */}
            </Text>
          </Flex>
        </Flex>
        {displayName && (
          <Flex row justifyContent="space-between">
            <Text color="$neutral2" variant="body2">
              {t('dapp.request.approve.label')}
            </Text>
            <Flex row gap="$spacing4">
              <Text textAlign="right" variant="subheading2">
                {displayName.name}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
      <Flex backgroundColor="$surface2" borderBottomLeftRadius="$rounded16" borderBottomRightRadius="$rounded16">
        <Flex
          row
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          px="$spacing16"
          py="$spacing12"
          width="100%"
        >
          <Text color="$neutral2" variant="body2">
            {t('transaction.networkCost.label')}
          </Text>
          <Text color="$neutral2" textAlign="right" variant="body2">
            {gasFeeFormatted}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

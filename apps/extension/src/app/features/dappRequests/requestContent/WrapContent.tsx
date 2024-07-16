import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useTransactionGasFee, useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

export const WrapTransactionDetails = ({
  request,
  dappUrl,
}: {
  request: DappRequestStoreItem
  dappUrl: string
}): JSX.Element => {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const activeAddress = useActiveAccountAddressWithThrow()
  const displayName = useDisplayName(activeAddress)

  const sendTransactionRequest = request.dappRequest as SendTransactionRequest

  const chainId = useDappLastChainId(dappUrl) || UniverseChainId.Mainnet

  const networkFee = useTransactionGasFee({
    chainId,
    ...sendTransactionRequest.transaction,
  }).value
  const gasFeeUSD = useUSDValue(chainId, networkFee)

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
            {convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { DomainContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/DomainContent'
import { MaybeExplorerLinkedAddress } from 'src/app/features/dappRequests/requestContent/SignTypeData/MaybeExplorerLinkedAddress'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

interface Permit2RequestProps {
  dappRequest: SignTypedDataRequest
}

export function Permit2RequestContent({ dappRequest }: Permit2RequestProps): JSX.Element | null {
  const { t } = useTranslation()

  const parsedTypedData = JSON.parse(dappRequest.typedData)
  const { name, chainId: domainChainId, verifyingContract } = parsedTypedData?.domain || {}
  const chainId = toSupportedChainId(domainChainId)

  const { token: address, amount, expiration, nonce } = parsedTypedData?.message?.details || {}
  const { spender, sigDeadline } = parsedTypedData?.message || {}
  const [open, setOpen] = useState(false)
  const toggleOpen = (): void => setOpen(!open)

  const spenderLink = chainId ? getExplorerLink(chainId, spender, ExplorerDataType.ADDRESS) : undefined
  const tokenLink = chainId ? getExplorerLink(chainId, address, ExplorerDataType.TOKEN) : undefined

  return (
    <DappRequestContent showNetworkCost confirmText={t('common.button.sign')} title={t('dapp.request.permit2.header')}>
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        flexDirection="column"
        gap="$spacing12"
        p="$spacing16"
        position="relative"
        width="100%"
      >
        <Flex row alignItems="center">
          <Text color="$neutral2" variant="body4">
            {t('dapp.request.permit2.description')}
          </Text>
          <TouchableArea onPress={toggleOpen}>
            <RotatableChevron color="$neutral2" direction={open ? 'up' : 'down'} height={16} width={16} />
          </TouchableArea>
        </Flex>
        {open && (
          <>
            <DomainContent chainId={domainChainId} name={name} verifyingContract={verifyingContract} />
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                token
              </Text>
              <MaybeExplorerLinkedAddress address={address} link={tokenLink} />
            </Flex>
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                amount
              </Text>
              <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
                {amount}
              </Text>
            </Flex>
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                expiration
              </Text>
              <Text color="$neutral1" variant="body4">
                {expiration}
              </Text>
            </Flex>
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                nonce
              </Text>
              <Text color="$neutral1" variant="body4">
                {nonce}
              </Text>
            </Flex>
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                spender
              </Text>
              <MaybeExplorerLinkedAddress address={spender} link={spenderLink} />
            </Flex>
            <Flex flexDirection="row" gap="$spacing8">
              <Text color="$neutral2" variant="body4">
                signature deadline
              </Text>
              <Text color="$neutral1" variant="body4">
                {sigDeadline}
              </Text>
            </Flex>
          </>
        )}
      </Flex>
    </DappRequestContent>
  )
}

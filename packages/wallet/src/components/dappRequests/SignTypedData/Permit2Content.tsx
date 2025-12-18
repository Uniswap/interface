import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { DomainContent } from 'wallet/src/components/dappRequests/SignTypedData/DomainContent'
import { MaybeExplorerLinkedAddress } from 'wallet/src/components/dappRequests/SignTypedData/MaybeExplorerLinkedAddress'

interface Permit2ContentProps {
  typedData: string
}

/**
 * Content for Permit2 typed data signatures
 * Shows collapsible details including domain info and permit parameters
 * @throws {Error} If the typed data cannot be parsed
 */
export function Permit2Content({ typedData }: Permit2ContentProps): JSX.Element {
  const { t } = useTranslation()
  const parsedTypedData = JSON.parse(typedData)
  const { name, chainId: domainChainId, verifyingContract } = parsedTypedData?.domain || {}
  const chainId = toSupportedChainId(domainChainId)

  const { token: address, amount, expiration, nonce } = parsedTypedData?.message?.details || {}
  const { spender, sigDeadline } = parsedTypedData?.message || {}
  const [open, setOpen] = useState(false)
  const toggleOpen = (): void => setOpen(!open)

  const spenderLink = chainId ? getExplorerLink({ chainId, data: spender, type: ExplorerDataType.ADDRESS }) : undefined
  const tokenLink = chainId ? getExplorerLink({ chainId, data: address, type: ExplorerDataType.TOKEN }) : undefined

  return (
    <Flex flexDirection="column" gap="$spacing12" px="$spacing16" position="relative" width="100%">
      <Flex row alignItems="center">
        <Text flexGrow={1} color="$neutral2" variant="body4">
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
  )
}

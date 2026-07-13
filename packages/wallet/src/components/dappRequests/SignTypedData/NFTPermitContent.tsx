import { Contract } from '@ethersproject/contracts'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ApproveAlt, ContractInteraction, RotatableChevron } from 'ui/src/components/icons'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { StandardTypedDataContent } from 'wallet/src/components/dappRequests/SignTypedData/StandardTypedDataContent'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import type { EIP712DomainType, EIP712Message } from 'wallet/src/components/dappRequests/types/EIP712Types'
import type { TransactionAsset } from 'wallet/src/features/dappRequests/types'
import { useProvider } from 'wallet/src/features/wallet/context'

const TOKEN_URI_ABI = ['function tokenURI(uint256 tokenId) view returns (string)']
const BASE64_JSON_PREFIX = 'data:application/json;base64,'

export function usePositionNFTImage({
  contractAddress,
  tokenId,
  chainId,
}: {
  contractAddress?: string
  tokenId: string
  chainId: UniverseChainId
}): { imageUri: string | undefined; loading: boolean } {
  const provider = useProvider(chainId)

  const { data, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.PositionTokenURI, contractAddress, tokenId, chainId],
    queryFn: async () => {
      if (!contractAddress || !provider) {
        return null
      }

      const contract = new Contract(contractAddress, TOKEN_URI_ABI, provider)
      const uri: string = await contract['tokenURI'](tokenId)

      if (!uri.startsWith(BASE64_JSON_PREFIX)) {
        return null
      }

      const json = JSON.parse(atob(uri.slice(BASE64_JSON_PREFIX.length)))
      const image = json.image as string | undefined
      if (!image?.startsWith('data:')) {
        return null
      }
      return image
    },
    enabled: !!contractAddress && !!provider,
  })

  return useMemo(() => ({ imageUri: data ?? undefined, loading: isLoading }), [data, isLoading])
}

export function buildNftApproveAsset({
  contractAddress,
  tokenId,
  chainId,
  logoUrl,
}: {
  contractAddress: string
  tokenId: string
  chainId: UniverseChainId
  logoUrl?: string
}): TransactionAsset {
  return {
    type: 'ERC721',
    name: `#${tokenId}`,
    address: contractAddress,
    chainId,
    logoUrl,
  }
}

interface NFTPermitContentProps {
  domain: EIP712DomainType
  message: EIP712Message
  chainId: UniverseChainId
}

export function NFTPermitContent({ domain, message, chainId }: NFTPermitContentProps): JSX.Element {
  const { t } = useTranslation()
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const tokenId = String(message['tokenId'])
  const contractAddress = domain.verifyingContract

  const { imageUri } = usePositionNFTImage({ contractAddress, tokenId, chainId })

  const asset = contractAddress
    ? buildNftApproveAsset({ contractAddress, tokenId, chainId, logoUrl: imageUri })
    : undefined

  return (
    <Flex gap="$spacing8">
      {asset && (
        <Flex px="$spacing16">
          <TransactionAssetList
            assets={[asset]}
            icon={ApproveAlt}
            iconColor="$statusSuccess"
            titleText={t('common.approving')}
            formatAmount={() => t('position.v3.nft')}
          />
        </Flex>
      )}
      <Flex>
        <Flex height={1} backgroundColor="$surface3" mb="$spacing12" />
        <TouchableArea onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}>
          <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
            <Flex row gap="$spacing8" alignItems="center">
              <ContractInteraction color="$neutral2" size="$icon.16" />
              <Text color="$neutral2" variant="buttonLabel3">
                {isDetailsExpanded ? t('dapp.transaction.details.hide') : t('common.button.viewDetails')}
              </Text>
            </Flex>
            <RotatableChevron color="$neutral2" direction={isDetailsExpanded ? 'up' : 'down'} size="$icon.12" />
          </Flex>
        </TouchableArea>
        {isDetailsExpanded && (
          <Flex pt="$spacing12">
            <StandardTypedDataContent domain={domain} message={message} />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

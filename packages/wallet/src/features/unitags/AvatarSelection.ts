import { GraphQLApi } from '@universe/api'
import { NUM_FIRST_NFTS } from 'uniswap/src/components/nfts/constants'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { formatNftItems } from 'uniswap/src/features/nfts/utils'
import { selectPhotoFromLibrary } from 'wallet/src/features/unitags/photoSelection'

export function useAvatarSelectionHandler({
  address,
  avatarImageUri,
  setAvatarImageUri,
  showModal,
}: {
  address: string
  avatarImageUri: string | undefined
  setAvatarImageUri: (uri: string) => void
  showModal: () => void
}): { avatarSelectionHandler: () => Promise<void>; hasNFTs: boolean } {
  const { gqlChains } = useEnabledChains()

  const { data: nftsData } = GraphQLApi.useNftsTabQuery({
    variables: {
      ownerAddress: address,
      first: NUM_FIRST_NFTS,
      filter: { filterSpam: false },
      chains: gqlChains,
    },
  })
  const nftItems = formatNftItems(nftsData)

  const hasNFTs = nftItems !== undefined && nftItems.length > 0
  const hasAvatarImage = avatarImageUri && avatarImageUri !== ''

  if (hasNFTs || hasAvatarImage) {
    return { avatarSelectionHandler: async () => showModal(), hasNFTs }
  } else {
    return {
      avatarSelectionHandler: async (): Promise<void> => {
        const selectedPhoto = await selectPhotoFromLibrary()
        if (selectedPhoto) {
          setAvatarImageUri(selectedPhoto)
        }
      },
      hasNFTs,
    }
  }
}

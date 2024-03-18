import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker'
import { useNftsTabQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NUM_FIRST_NFTS } from 'wallet/src/components/nfts/NftsList'
import { formatNftItems } from 'wallet/src/features/nfts/utils'

// Selected image will be shrunk to max width/height
// URI will then be for an image of those dimensions
const IMAGE_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  maxWidth: 500,
  maxHeight: 500,
  quality: 1, // best quality
  includeBase64: false,
  selectionLimit: 1,
}

export async function selectPhotoFromLibrary(): Promise<string | undefined> {
  const response = await launchImageLibrary(IMAGE_OPTIONS)
  if (!response.didCancel && !response.errorCode && response.assets) {
    return response.assets[0]?.uri
  }
}

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
  const { data: nftsData } = useNftsTabQuery({
    variables: { ownerAddress: address, first: NUM_FIRST_NFTS, filter: { filterSpam: false } },
  })
  const nftItems = formatNftItems(nftsData)

  const hasNFTs = nftItems !== undefined && nftItems?.length > 0
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

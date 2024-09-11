import { StyleSheet } from 'react-native'
import { useSimpleHashNft } from 'uniswap/src/data/apiClients/simpleHashApi/useSimpleHashNft'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ImageUri, ImageUriProps } from 'wallet/src/features/images/ImageUri'

type NFTPreviewProps = {
  contractAddress: string
  tokenId: string
  imageProps: ImageUriProps
}

export function NFTPreviewImage({ contractAddress, tokenId, imageProps }: NFTPreviewProps): JSX.Element | null {
  const { data, isLoading } = useSimpleHashNft({
    params: { contractAddress, tokenId },
    staleTime: 5 * ONE_MINUTE_MS,
  })

  const imageUrl = data?.previews?.image_medium_url

  if (imageUrl || isLoading) {
    return (
      <ImageUri {...imageProps} loadedImageContainerStyle={styles.loadedImageContainer} uri={imageUrl ?? undefined} />
    )
  }

  // Render fallback if there is no preview
  return imageProps.fallback ?? null
}

const styles = StyleSheet.create({
  loadedImageContainer: {
    backgroundColor: '#fff',
  },
})

import { StyleSheet } from 'react-native'
import { useNftPreviewUri } from 'wallet/src/features/images/hooks'
import { ImageUri, ImageUriProps } from 'wallet/src/features/images/ImageUri'

type NFTPreviewProps = {
  contractAddress: string
  tokenId: string
  imageProps: ImageUriProps
}

export function NFTPreviewImage({
  contractAddress,
  tokenId,
  imageProps,
}: NFTPreviewProps): JSX.Element | null {
  const { data, loading } = useNftPreviewUri(contractAddress, tokenId)

  const imageUrl = data?.previews?.image_medium_url

  if (imageUrl || loading) {
    return (
      <ImageUri
        {...imageProps}
        loadedImageContainerStyle={styles.loadedImageContainer}
        uri={imageUrl ?? undefined}
      />
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

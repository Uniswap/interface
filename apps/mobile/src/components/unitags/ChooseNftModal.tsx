import { NftView } from 'src/components/NFT/NftView'
import { useDeviceInsets, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { ModalName } from 'wallet/src/telemetry/constants'

type ChooseNftProps = {
  address: string
  setPhotoUri: (uri?: string) => void
  onClose: () => void
}

export const ChooseNftModal = ({ address, setPhotoUri, onClose }: ChooseNftProps): JSX.Element => {
  const colors = useSporeColors()
  const insets = useDeviceInsets()

  const renderNFT = (item: NFTItem): JSX.Element => {
    const onPressNft = (): void => {
      setPhotoUri(item.imageUrl)
      onClose()
    }
    return <NftView item={item} owner={address} onPress={onPressNft} />
  }

  return (
    <BottomSheetModal
      overrideInnerContainer
      backgroundColor={colors.surface1.get()}
      hideHandlebar={false}
      isDismissible={true}
      name={ModalName.NftCollection}
      onClose={onClose}>
      <NftsList
        renderedInModal
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.spacing12,
          paddingTop: spacing.spacing12,
          paddingHorizontal: spacing.spacing12,
        }}
        owner={address}
        renderNFTItem={renderNFT}
      />
    </BottomSheetModal>
  )
}

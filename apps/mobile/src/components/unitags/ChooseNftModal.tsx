import { NftView } from 'src/components/NFT/NftView'
import { Flex, useSporeColors } from 'ui/src'
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

  const renderNFT = (item: NFTItem): JSX.Element => {
    const onPressNft = (): void => {
      setPhotoUri(item.imageUrl)
      onClose()
    }
    return <NftView item={item} owner={address} onPress={onPressNft} />
  }

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      hideHandlebar={false}
      isDismissible={true}
      name={ModalName.NftCollection}
      onClose={onClose}>
      <Flex grow pb="$spacing36" pt="$spacing16" px="$spacing12">
        <NftsList renderedInModal owner={address} renderNFTItem={renderNFT} />
      </Flex>
    </BottomSheetModal>
  )
}

import { GraphQLApi } from '@universe/api'
import { useCallback, useState } from 'react'
import { NUM_FIRST_NFTS } from 'uniswap/src/components/nfts/constants'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { formatNftItems } from 'uniswap/src/features/nfts/utils'
import { selectPhotoFromLibrary } from 'wallet/src/features/unitags/photoSelection'

export function useAvatarSelectionHandler({
  address,
  avatarImageUri,
  setAvatarImageUri,
  onOpenModal,
  onCloseModal,
}: {
  address: string
  avatarImageUri: string | undefined
  setAvatarImageUri: (uri?: string) => void
  onOpenModal?: () => void
  onCloseModal?: () => void
}): {
  avatarSelectionHandler: () => Promise<void>
  hasNFTs: boolean
  showModal: boolean
  openModal: () => void
  closeModal: () => void
} {
  const { gqlChains } = useEnabledChains()
  const [showModal, setShowModal] = useState(false)

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

  const openModal = useCallback((): void => {
    onOpenModal?.()
    setShowModal(true)
  }, [onOpenModal])

  const closeModal = useCallback((): void => {
    onCloseModal?.()
    setShowModal(false)
  }, [onCloseModal])

  const avatarSelectionHandler = useCallback(async (): Promise<void> => {
    if (hasNFTs || hasAvatarImage) {
      openModal()
      return
    }

    const selectedPhoto = await selectPhotoFromLibrary()
    if (selectedPhoto) {
      setAvatarImageUri(selectedPhoto)
    }
  }, [hasAvatarImage, hasNFTs, openModal, setAvatarImageUri])

  return { avatarSelectionHandler, hasNFTs, showModal, openModal, closeModal }
}

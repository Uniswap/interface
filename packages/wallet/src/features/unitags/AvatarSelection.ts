import { useCallback, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useWalletNfts } from 'uniswap/src/features/nfts/hooks/useWalletNfts'
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
  const { chains } = useEnabledChains()
  const [showModal, setShowModal] = useState(false)

  const { nfts } = useWalletNfts({
    address,
    filterSpam: false,
    chainsFilter: chains,
    pageSize: 1,
  })

  const hasNFTs = nfts.length > 0
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

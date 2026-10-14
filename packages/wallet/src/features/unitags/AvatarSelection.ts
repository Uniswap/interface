import { useCallback, useState } from 'react'
import { useWalletNfts } from 'uniswap/src/data/apiClients/dataApiService/nfts/useWalletNfts'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
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

  const { nfts, isPending, isError } = useWalletNfts({
    address,
    filterSpam: false,
    chainsFilter: chains,
    pageSize: 1,
  })

  const hasNFTs = nfts.length > 0
  // A pending or errored eligibility check is not evidence the wallet has zero NFTs — falling
  // through to camera roll here would be indistinguishable from a real empty wallet, so treat
  // "we don't know yet" the same as "might have NFTs" and let the modal resolve once data lands.
  const isNFTEligibilityUnknown = isPending || isError
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
    if (hasNFTs || hasAvatarImage || isNFTEligibilityUnknown) {
      openModal()
      return
    }

    const selectedPhoto = await selectPhotoFromLibrary()
    if (selectedPhoto) {
      setAvatarImageUri(selectedPhoto)
    }
  }, [hasAvatarImage, hasNFTs, isNFTEligibilityUnknown, openModal, setAvatarImageUri])

  return { avatarSelectionHandler, hasNFTs, showModal, openModal, closeModal }
}

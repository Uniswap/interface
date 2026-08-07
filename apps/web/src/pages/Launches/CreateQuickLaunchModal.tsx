import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CreateAuctionContextProvider } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { CreateAuctionSteps } from '~/pages/Liquidity/CreateAuction/CreateAuctionSteps'
import { QuickLaunchModalContext } from '~/pages/Liquidity/CreateAuction/quickLaunchModalContext'

/**
 * The launches-page create flow: the literal create-auction wizard hosted in a modal, locked to
 * quick launch (see QuickLaunchModalContext). Submitting the form skips the review screen and
 * opens the review-and-sign modal directly.
 */
export default function CreateQuickLaunchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()

  // No explicit maxHeight: the modal sizes to its content, capped at the viewport by
  // AdaptiveWebModal, so the body only scrolls when the viewport is shorter than the form.
  return (
    <Modal
      name={ModalName.QuickLaunchCreate}
      isModalOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      padding="$spacing24"
      borderRadius="$rounded24"
    >
      <Flex width="100%" gap="$spacing16">
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.createAuction.quickLaunch.title')}
          </Text>
          <TouchableArea onPress={onClose}>
            <X size="$icon.20" color="$neutral2" />
          </TouchableArea>
        </Flex>
        <Flex width="100%" $platform-web={{ overflowY: 'auto' }}>
          <QuickLaunchModalContext.Provider value={true}>
            <CreateAuctionContextProvider>
              <CreateAuctionSteps />
            </CreateAuctionContextProvider>
          </QuickLaunchModalContext.Provider>
        </Flex>
      </Flex>
    </Modal>
  )
}

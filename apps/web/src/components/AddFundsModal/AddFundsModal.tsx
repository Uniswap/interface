import { Flex, ModalCloseIcon, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { AddFundsOptionCards } from '~/components/emptyWallet/AddFundsOptionCards'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useModalState } from '~/hooks/useModalState'

const MODAL_MAX_WIDTH = 480

const MODAL_ELEMENT_NAMES = {
  buy: ElementName.AddFundsModalBuy,
  receive: ElementName.AddFundsModalReceive,
  cexTransfer: ElementName.AddFundsModalCEXTransfer,
}

export function AddFundsModal(): JSX.Element {
  const { t } = useTranslation()
  const { isOpen, closeModal } = useModalState(ModalName.AddFunds)
  const buyParams = useModalInitialState(ModalName.AddFunds)

  return (
    <Modal
      name={ModalName.AddFunds}
      isModalOpen={isOpen}
      onClose={closeModal}
      maxWidth={MODAL_MAX_WIDTH}
      testID={TestID.AddFundsModal}
    >
      <Flex row justifyContent="flex-end" width="100%">
        <ModalCloseIcon onClose={closeModal} />
      </Flex>
      <Flex gap="$spacing32" px="$spacing8" pt="$spacing12" pb="$spacing16">
        <Text variant="heading3" color="$neutral1" textAlign="center">
          {t('addFunds.modal.title')}
        </Text>
        {/* Receive and the provider list replace this modal in redux, so only leaving the page needs an explicit close. */}
        <AddFundsOptionCards elementNames={MODAL_ELEMENT_NAMES} buyParams={buyParams} onLeave={closeModal} />
      </Flex>
    </Modal>
  )
}

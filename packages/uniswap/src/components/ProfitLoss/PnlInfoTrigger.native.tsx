import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { PnlDefinitionsList } from 'uniswap/src/components/ProfitLoss/PnlDefinitions'
import { PnlInfoTriggerProps } from 'uniswap/src/components/ProfitLoss/PnlInfoTrigger'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function PnlInfoTrigger({ metrics, footer }: PnlInfoTriggerProps): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const onOpen = (): void => setIsOpen(true)
  const onClose = (): void => setIsOpen(false)

  return (
    <>
      <TouchableArea onPress={onOpen}>
        <InfoCircleFilled color="$neutral3" size="$icon.16" />
      </TouchableArea>
      <Modal isModalOpen={isOpen} name={ModalName.PnlDefinitions} onClose={onClose}>
        <Flex gap="$spacing24" pb="$spacing24" pt="$spacing12" px="$spacing24">
          <PnlDefinitionsList metrics={metrics} footer={footer} gap="$spacing24" />
          <Flex row>
            <Button fill emphasis="secondary" size="medium" onPress={onClose}>
              {t('common.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
}

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue } from 'react-native'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'

const DEFAULT_ICON_SIZE = 20

type InfoButtonProps = {
  modalText: string
  modalTitle: string
  modalIcon?: JSX.Element
  modalContent?: JSX.Element
  backgroundIconColor?: ColorValue
  size?: number
  closeText?: string
} & TouchableAreaProps

export function TooltipInfoButton({
  size,
  backgroundIconColor,
  closeText,
  modalText,
  modalTitle,
  modalIcon,
  modalContent,
  ...rest
}: InfoButtonProps): JSX.Element {
  const colors = useSporeColors()
  const [showModal, setShowModal] = useState(false)
  const { t } = useTranslation()
  return (
    <>
      <TouchableArea onPress={(): void => setShowModal(true)} {...rest}>
        <InfoCircle
          color={colors.neutral2.get()}
          height={size ?? DEFAULT_ICON_SIZE}
          width={size ?? DEFAULT_ICON_SIZE}
        />
      </TouchableArea>
      {showModal && (
        <WarningModal
          backgroundIconColor={backgroundIconColor}
          caption={modalText}
          closeText={closeText ?? t('Close')}
          icon={modalIcon}
          modalName={ModalName.TooltipContent}
          title={modalTitle}
          onClose={(): void => setShowModal(false)}>
          {modalContent ?? null}
        </WarningModal>
      )}
    </>
  )
}

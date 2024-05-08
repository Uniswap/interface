import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, Keyboard } from 'react-native'
import { TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'wallet/src/telemetry/constants'

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
      <TouchableArea
        onPress={(): void => {
          Keyboard.dismiss()
          setShowModal(true)
        }}
        {...rest}>
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
          closeText={closeText ?? t('common.button.close')}
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

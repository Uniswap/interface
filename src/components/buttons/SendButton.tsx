import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import SendIcon from 'src/assets/icons/send.svg'
import {
  Button,
  ButtonEmphasis,
  ButtonProps,
  ButtonSize,
  ButtonState,
} from 'src/components-uds/Button/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface Props extends Omit<ButtonProps, 'emphasis' | 'label' | 'size' | 'state'> {
  iconOnly?: boolean
  disabled?: boolean
  iconSize?: number
  iconStrokeWidth?: number
  initialState?: TransactionState
}

export function SendButton({
  disabled = false,
  iconOnly = false,
  iconSize = 20,
  iconStrokeWidth = 2,
  initialState,
  ...rest
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const sendButtonDisabled =
    disabled || !activeAccount || activeAccount.type === AccountType.Readonly

  const onPressSend = useCallback(() => {
    dispatch(openModal({ name: ModalName.Send, ...(initialState ? { initialState } : {}) }))
  }, [dispatch, initialState])

  return iconOnly ? (
    // TODO: Implement iconOnly using the new components-uds Button
    <IconButton
      bg="backgroundAction"
      borderRadius="md"
      disabled={sendButtonDisabled}
      icon={
        <SendIcon
          color={theme.colors.textSecondary}
          height={iconSize}
          strokeWidth={iconStrokeWidth}
          width={iconSize}
        />
      }
      justifyContent="center"
      px="md"
      onPress={onPressSend}
    />
  ) : (
    <Button
      emphasis={ButtonEmphasis.Low}
      icon={
        <SendIcon
          height={iconSize}
          stroke={theme.colors.textPrimary}
          strokeWidth={iconStrokeWidth}
          width={iconSize}
        />
      }
      label={t('Send')}
      size={ButtonSize.Medium}
      state={sendButtonDisabled ? ButtonState.Disabled : ButtonState.Enabled}
      onPress={onPressSend}
      {...rest}
    />
  )
}

import { selectionAsync } from 'expo-haptics'
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
import { Theme } from 'src/styles/theme'

interface Props extends Omit<ButtonProps, 'emphasis' | 'label' | 'size' | 'state'> {
  iconOnly?: boolean
  disabled?: boolean
  iconColor?: keyof Theme['colors']
  iconSize?: number
  iconStrokeWidth?: number
  initialState?: TransactionState
  bg?: keyof Theme['colors']
}

export function SendButton({
  bg,
  disabled = false,
  iconColor,
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
    selectionAsync()
    dispatch(openModal({ name: ModalName.Send, ...(initialState ? { initialState } : {}) }))
  }, [dispatch, initialState])

  return iconOnly ? (
    // TODO: Implement iconOnly using the new components-uds Button
    <IconButton
      bg={bg ?? 'background3'}
      borderRadius="md"
      disabled={sendButtonDisabled}
      icon={
        <SendIcon
          color={iconColor ? theme.colors[iconColor] : theme.colors.textSecondary}
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
      noTextScaling
      emphasis={ButtonEmphasis.Low}
      icon={
        <SendIcon
          color={iconColor ? theme.colors[iconColor] : undefined}
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

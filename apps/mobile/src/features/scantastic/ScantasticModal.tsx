import React, { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { ModalName } from 'wallet/src/telemetry/constants'
import { getEncryptedMnemonic } from './ScantasticEncryption'

enum OtpState {
  Pending = 'pending',
  Redeemed = 'redeemed',
  Expired = 'expired',
}
interface OtpStateApiResponse {
  otp?: OtpState
  expiresAtInSeconds?: number
}

export function ScantasticModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const account = useActiveAccount()

  const { initialState } = useAppSelector(selectModalState(ModalName.Scantastic))
  const [OTP, setOTP] = useState('')
  // Once a user has scanned a QR they have 6 minutes to correctly input the OTP
  const [expirationTimestamp, setExpirationTimestamp] = useState<number>(
    Date.now() + 6 * ONE_MINUTE_MS
  )
  const pubKey: JsonWebKey = initialState?.pubKey ? JSON.parse(initialState?.pubKey) : undefined
  const uuid = initialState?.uuid
  const device = initialState?.vendor + ' ' + initialState?.model || ''
  const browser = initialState?.browser || ''

  const [expired, setExpired] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [expiryText, setExpiryText] = useState('')

  if (redeemed) {
    dispatch(
      pushNotification({
        type: AppNotificationType.ScantasticComplete,
        hideDelay: 6 * ONE_SECOND_MS,
      })
    )
    dispatch(closeAllModals())
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const timeLeft = expirationTimestamp - Date.now()
      if (timeLeft <= 0) {
        return setExpiryText(t('Expired'))
      }
      return setExpiryText(
        t('New code in {{duration}}', {
          duration: getDurationRemainingString(expirationTimestamp),
        })
      )
    }, ONE_SECOND_MS)

    return () => clearInterval(interval)
  }, [expirationTimestamp, t])

  const onClose = useCallback((): void => {
    dispatch(closeAllModals())
  }, [dispatch])

  const onEncryptSeedphrase = async (): Promise<void> => {
    let encryptedSeedphrase = ''

    try {
      if (!pubKey.n || !pubKey.e) {
        throw new Error(t('Invalid public key'))
      }
      encryptedSeedphrase = await getEncryptedMnemonic(account?.address || '', pubKey.n, pubKey.e)
    } catch (e) {
      // TODO(EXT-485): improve error handling
      logger.error(e, { tags: { file: 'ScantasticModal', function: 'getEncryptedMnemonic' } })
    }

    try {
      // submit encrypted blob
      const response = await fetch(`${uniswapUrls.apiBaseExtensionUrl}/scantastic/blob`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: 'https://uniswap.org',
        },
        body: JSON.stringify({
          uuid,
          blob: encryptedSeedphrase,
        }),
      })
      if (!response.ok) {
        throw new Error(t('Failed to send.'))
      }
      const data = await response.json()
      if (!data?.otp) {
        throw new Error(t('OTP unavailable'))
      } else {
        setExpirationTimestamp(Date.now() + ONE_MINUTE_MS * 2)
        setOTP(data.otp)
      }
    } catch (e) {
      // TODO(EXT-485): improve error handling
      logger.error(e, { tags: { file: 'ScantasticModal', function: 'fetch' } })
    }
  }

  const { trigger: biometricTrigger } = useBiometricPrompt(onEncryptSeedphrase)
  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()

  const onConfirmSync = async (): Promise<void> => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      await biometricTrigger()
    } else {
      await onEncryptSeedphrase()
    }
  }

  const checkOTPState = useCallback(async (): Promise<void> => {
    if (!OTP || !uuid) {
      return
    }
    try {
      const response = await fetch(
        `${uniswapUrls.apiBaseExtensionUrl}/scantastic/otp-state/${uuid}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Origin: 'https://uniswap.org',
          },
        }
      )
      if (!response.ok) {
        return
      }
      const data: OtpStateApiResponse = await response.json()
      const otpState = data.otp
      if (!otpState) {
        return
      }
      if (data.expiresAtInSeconds) {
        setExpirationTimestamp(data.expiresAtInSeconds * ONE_SECOND_MS)
      }
      if (otpState === OtpState.Redeemed) {
        setRedeemed(true)
      }
      if (otpState === OtpState.Expired) {
        setExpired(true)
      }
    } catch (e) {
      logger.warn('ScanToOnboard.tsx', 'checkOTPState', e as string)
    }
  }, [OTP, uuid])

  useInterval(checkOTPState, 6000, true)

  if (expired) {
    return (
      <BottomSheetModal
        backgroundColor={colors.surface1.get()}
        name={ModalName.OtpInputExpired}
        onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
            <Icons.LinkBrokenHorizontal color="$neutral2" size={iconSizes.icon24} />
          </Flex>
          <Text variant="subheading1">{t('Your connection timed out')}</Text>
          <Text color="$neutral2" mb="$spacing12" textAlign="center" variant="body3">
            {t('Scan the QR code on the Uniswap Extension again to continue syncing your wallet.')}
          </Text>
          <Button theme="secondary" width="100%" onPress={onClose}>
            {t('Close')}
          </Button>
        </Flex>
      </BottomSheetModal>
    )
  }

  if (OTP) {
    return (
      <BottomSheetModal
        backgroundColor={colors.surface1.get()}
        name={ModalName.OtpScanInput}
        onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
            <Icons.Laptop color="$accent1" size={iconSizes.icon24} />
          </Flex>
          <Text variant="subheading1">{t('Uniswap one-time code')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            <Trans>
              Enter this code in the Uniswap Extension. Your recovery phrase will be safely
              encrypted and transferred.
            </Trans>
          </Text>
          <Flex row gap="$spacing20" py="$spacing8">
            <Text variant="heading1">{OTP.substring(0, 3).split('').join(' ')}</Text>
            <Text variant="heading1">{OTP.substring(3).split('').join(' ')}</Text>
          </Flex>
          <Text color="$neutral3" variant="body3">
            {expiryText}
          </Text>
        </Flex>
      </BottomSheetModal>
    )
  }

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.RemoveSeedPhraseWarningModal}
      onClose={onClose}>
      <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
        <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
          <Icons.Laptop color="$accent1" size={iconSizes.icon24} />
        </Flex>
        <Text variant="subheading1">{t('Is this your device?')}</Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {t('Only continue if you are syncing with the Uniswap Extension on a trusted device.')}
        </Text>
        <Flex
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth={1}
          gap="$spacing12"
          p="$spacing16"
          width="100%">
          {device && (
            <Flex row px="$spacing8">
              <Text color="$neutral2" flex={1} variant="body3">
                {t('Device')}
              </Text>
              <Text variant="body3">{device}</Text>
            </Flex>
          )}
          {browser && (
            <Flex row px="$spacing8">
              <Text color="$neutral2" flex={1} variant="body3">
                {t('Browser')}
              </Text>
              <Text variant="body3">{browser}</Text>
            </Flex>
          )}
        </Flex>
        <Flex flexDirection="column" gap="$spacing4" mt="$spacing12" width="100%">
          <Button
            icon={<Icons.Faceid size={iconSizes.icon16} />}
            mb="$spacing4"
            theme="primary"
            onPress={onConfirmSync}>
            {t('Yes, continue')}
          </Button>
          <TouchableArea alignItems="center" onPress={onClose}>
            <Text color="$accent1" py="$spacing16" variant="buttonLabel2">
              {t('Cancel')}
            </Text>
          </TouchableArea>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

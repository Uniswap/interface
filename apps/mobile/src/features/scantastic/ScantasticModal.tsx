import React, { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { config } from 'wallet/src/config'
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
  expiresAt?: number
}

export function ScantasticModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const account = useActiveAccount()

  const { initialState } = useAppSelector(selectModalState(ModalName.Scantastic))
  const [OTP, setOTP] = useState('')
  const [expirationTimestamp, setExpirationTimestamp] = useState(
    Number(initialState?.expiry) * ONE_SECOND_MS
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
      if (Number.isNaN(expirationTimestamp)) {
        return
      }
      const timeLeft = expirationTimestamp - Date.now()

      if (timeLeft <= 0) {
        setExpiryText(t('Expired'))
        clearInterval(interval)
        setExpired(true)
      } else {
        const minutes = Math.floor(timeLeft / 60000)
        const seconds = ((timeLeft % 60000) / 1000).toFixed(0)
        setExpiryText(t(`Session expires in ${minutes}m${seconds}s`))
      }
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
      const response = await fetch(`${config.tempScantasticUrl}/blob`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
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
        setExpirationTimestamp(Date.now() + 1000 * 60 * 2)
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
      const response = await fetch(`${config.tempScantasticUrl}/otp-state/${uuid}`)
      if (!response.ok) {
        return
      }
      const data: OtpStateApiResponse = await response.json()
      const otpState = data.otp
      if (!otpState) {
        return
      }

      const expiresAtMs = data.expiresAt && data.expiresAt * ONE_SECOND_MS
      setExpirationTimestamp((current) => expiresAtMs ?? current)

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
        <Flex centered gap="$spacing16" height="100%" mb="$spacing24" p="$spacing24" pt="$none">
          <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
            <Icons.Laptop size={iconSizes.icon24} />
          </Flex>
          <Text variant="subheading1">
            <Trans>Your session timed out</Trans>
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            <Trans>
              Scan the QR code on the Uniswap Extension again to continue syncing your wallet.
            </Trans>
          </Text>
          <Button theme="secondary" width="100%" onPress={onClose}>
            <Text>Close</Text>
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
        <Flex centered gap="$spacing16" height="100%" mb="$spacing24" p="$spacing24" pt="$none">
          <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
            <Icons.Laptop size={iconSizes.icon24} />
          </Flex>
          <Text variant="subheading1">
            <Trans>Uniswap one-time code</Trans>
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            <Trans>
              Enter this code in the Uniswap Extension. Your recovery phrase will be safely
              encrypted and transferred.
            </Trans>
          </Text>
          <Text variant="heading1">
            {OTP.substring(0, 3)} {OTP.substring(3)}
          </Text>
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
      <Flex centered gap="$spacing16" height="100%" mb="$spacing24" p="$spacing24" pt="$none">
        <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
          <Icons.Laptop size={iconSizes.icon24} />
        </Flex>
        <Text variant="subheading1">
          <Trans>Is this your device?</Trans>
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          <Trans>
            Only continue if you are syncing with the Uniswap Extension on a trusted device.
          </Trans>
        </Text>
        {device && (
          <Flex row paddingHorizontal="$spacing8">
            <Text color="$neutral2" flex={1} variant="body3">
              <Trans>Device</Trans>
            </Text>
            <Text variant="body3">{device}</Text>
          </Flex>
        )}
        {browser && (
          <Flex row paddingHorizontal="$spacing8">
            <Text color="$neutral2" flex={1} variant="body3">
              <Trans>Browser</Trans>
            </Text>
            <Text variant="body3">{browser}</Text>
          </Flex>
        )}
        <Flex flexDirection="column" gap="$spacing4" mt="$spacing12" width="100%">
          <Button
            icon={<Icons.Faceid size={iconSizes.icon16} />}
            mb="$spacing4"
            theme="primary"
            onPress={onConfirmSync}>
            <Text>
              <Trans>Yes, continue</Trans>
            </Text>
          </Button>
          <Button backgroundColor="$transparent" theme="secondary" onPress={onClose}>
            <Text color="$accent1">
              <Trans>Cancel</Trans>
            </Text>
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

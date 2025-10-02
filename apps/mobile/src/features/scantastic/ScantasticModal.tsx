import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { getEncryptedMnemonic } from 'src/features/scantastic/ScantasticEncryption'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled, Faceid, Laptop, LinkBrokenHorizontal, Wifi } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { getOtpDurationString } from 'wallet/src/utils/duration'

const IP_MISMATCH_STATUS_CODE = 401

enum OtpState {
  Pending = 'pending',
  Redeemed = 'redeemed',
  Expired = 'expired',
}
interface OtpStateApiResponse {
  otp?: OtpState
  expiresAtInSeconds?: number
}

export function ScantasticModal({ route }: AppStackScreenProp<typeof ModalName.Scantastic>): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { onClose } = useReactNavigationModal()

  // Use the first mnemonic account because zero-balance mnemonic accounts will fail to retrieve the mnemonic from rnEthers
  const account = useSignerAccounts().sort(
    (account1, account2) => account1.derivationIndex - account2.derivationIndex,
  )[0]

  if (!account) {
    throw new Error('This should not be accessed with no mnemonic accounts')
  }

  const params = route.params.params

  const [OTP, setOTP] = useState('')
  // Once a user has scanned a QR they have 6 minutes to correctly input the OTP
  const [expirationTimestamp, setExpirationTimestamp] = useState<number>(Date.now() + 6 * ONE_MINUTE_MS)
  const pubKey = params.publicKey
  const uuid = params.uuid
  const device = `${params.vendor || ''} ${params.model || ''}`.trim()
  const browser = params.browser || ''

  const [expired, setExpired] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [error, setError] = useState('')

  // Warning state if backend response identifies mismatched IPs between devices
  const [showIPWarning, setShowIPWarning] = useState(false)

  const [expiryText, setExpiryText] = useState('')
  const setExpirationText = useCallback(() => {
    const expirationString = getOtpDurationString(expirationTimestamp)
    setExpiryText(expirationString)
  }, [expirationTimestamp])
  useInterval(setExpirationText, ONE_SECOND_MS)

  useEffect(() => {
    if (redeemed) {
      dispatch(
        pushNotification({
          type: AppNotificationType.ScantasticComplete,
          hideDelay: 6 * ONE_SECOND_MS,
        }),
      )
      onClose()
      dispatch(closeAllModals())
    }
  }, [redeemed, onClose, dispatch])

  useEffect(() => {
    const interval = setInterval(() => {
      const timeLeft = expirationTimestamp - Date.now()
      setExpired(timeLeft <= 0)
    }, ONE_SECOND_MS)

    return () => clearInterval(interval)
  }, [expirationTimestamp])

  const onEncryptSeedphrase = async (): Promise<void> => {
    setError('')
    let encryptedSeedphrase = ''
    const { n, e } = pubKey
    try {
      encryptedSeedphrase = await getEncryptedMnemonic({
        mnemonicId: account.address,
        modulus: n,
        exponent: e,
      })
    } catch (err) {
      setError(t('scantastic.error.encryption'))
      logger.error(err, {
        tags: {
          file: 'ScantasticModal',
          function: 'onEncryptSeedphrase->getEncryptedMnemonic',
        },
        extra: {
          address: account.address,
          n,
          e,
        },
      })
    }

    try {
      // submit encrypted blob
      const response = await fetch(`${uniswapUrls.scantasticApiUrl}/blob`, {
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

      if (response.status === IP_MISMATCH_STATUS_CODE) {
        setShowIPWarning(true)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to post blob: ${await response.text()}`)
      }
      const data = await response.json()
      if (!data?.otp) {
        throw new Error('OTP unavailable')
      } else {
        setExpirationTimestamp(Date.now() + ONE_MINUTE_MS * 2)
        setOTP(data.otp)
      }
    } catch (err) {
      setError(t('scantastic.error.noCode'))
      logger.error(err, {
        tags: {
          file: 'ScantasticModal',
          function: `onEncryptSeedphrase->fetch`,
        },
        extra: { uuid },
      })
    }
  }

  const { trigger: biometricTrigger } = useBiometricPrompt(onEncryptSeedphrase)
  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()
  const requiresBiometricAuth = biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions

  const onConfirmSync = async (): Promise<void> => {
    if (requiresBiometricAuth) {
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
      const response = await fetch(`${uniswapUrls.scantasticApiUrl}/otp-state/${uuid}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Origin: 'https://uniswap.org',
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to check OTP state: ${await response.text()}`)
      }
      const data: OtpStateApiResponse = await response.json()
      const otpState = data.otp
      if (!otpState) {
        throw new Error('No OTP state received.')
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
      logger.error(e, {
        tags: {
          file: 'ScantasticModal',
          function: `checkOTPState`,
        },
        extra: { uuid },
      })
    }
  }, [OTP, uuid])

  useInterval(checkOTPState, ONE_SECOND_MS, true)

  if (showIPWarning) {
    return (
      <Modal backgroundColor={colors.surface1.val} name={ModalName.OtpInputExpired} onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
            <Wifi color="$neutral2" size="$icon.24" />
          </Flex>
          <Flex centered gap="$spacing12">
            <Text variant="subheading1">{t('scantastic.modal.ipMismatch.title')}</Text>
            <Text color="$neutral2" px="$spacing16" textAlign="center" variant="body3">
              {t('scantastic.modal.ipMismatch.description')}
            </Text>
          </Flex>
          <Flex row>
            <Button size="large" emphasis="secondary" onPress={onClose}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    )
  }

  if (expired) {
    return (
      <Modal backgroundColor={colors.surface1.val} name={ModalName.OtpInputExpired} onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
            <LinkBrokenHorizontal color="$neutral2" size="$icon.24" />
          </Flex>
          <Text variant="subheading1">{t('scantastic.error.timeout.title')}</Text>
          <Text color="$neutral2" mb="$spacing12" textAlign="center" variant="body3">
            {t('scantastic.error.timeout.message')}
          </Text>
          <Flex row>
            <Button size="large" emphasis="secondary" onPress={onClose}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    )
  }

  if (OTP) {
    return (
      <Modal backgroundColor={colors.surface1.val} name={ModalName.OtpScanInput} onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
            <Laptop color="$accent1" size="$icon.24" />
          </Flex>
          <Text variant="subheading1">{t('scantastic.code.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('scantastic.code.subtitle')}
          </Text>
          <Flex row gap="$spacing20" py="$spacing8">
            <Text variant="heading1">{OTP.substring(0, 3).split('').join(' ')}</Text>
            <Text variant="heading1">{OTP.substring(3).split('').join(' ')}</Text>
          </Flex>
          <Text color="$neutral3" variant="body2">
            {expiryText}
          </Text>
        </Flex>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal backgroundColor={colors.surface1.val} name={ModalName.OtpScanInput} onClose={onClose}>
        <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
          <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
            <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
          </Flex>
          <Text variant="subheading1">{t('common.text.error')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {error}
          </Text>
          <Flex row mt="$spacing12">
            <Button size="large" emphasis="secondary" onPress={onClose}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    )
  }

  const renderDeviceDetails = Boolean(device || browser)

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.Scantastic} onClose={onClose}>
      <Flex centered gap="$spacing16" px="$spacing16" py="$spacing12">
        <Flex centered backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
          <Laptop color="$accent1" size="$icon.24" />
        </Flex>
        <Text testID={TestID.ScantasticConfirmationTitle} variant="subheading1">
          {t('scantastic.confirmation.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {t('scantastic.confirmation.subtitle')}
        </Text>
        {renderDeviceDetails && (
          <Flex
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth="$spacing1"
            gap="$spacing12"
            p="$spacing16"
            width="100%"
          >
            {device && (
              <Flex row px="$spacing8">
                <Text color="$neutral2" flex={1} variant="body3">
                  {t('scantastic.confirmation.label.device')}
                </Text>
                <Text testID={TestID.ScantasticDevice} variant="body3">
                  {device}
                </Text>
              </Flex>
            )}
            {browser && (
              <Flex row px="$spacing8">
                <Text color="$neutral2" flex={1} variant="body3">
                  {t('scantastic.confirmation.label.browser')}
                </Text>
                <Text testID={TestID.ScantasticBrowser} variant="body3">
                  {browser}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
        <Flex
          row
          alignItems="center"
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          gap="$spacing8"
          p="$spacing16"
          width="100%"
        >
          <AlertTriangleFilled color="$neutral2" size="$icon.20" />
          <Text color="$neutral2" variant="body4">
            {t('scantastic.confirmation.warning')}
          </Text>
        </Flex>
        <Flex gap="$spacing4" width="100%">
          <Flex row>
            <Button
              icon={requiresBiometricAuth ? <Faceid size="$icon.16" /> : undefined}
              mb="$spacing4"
              size="large"
              variant="branded"
              onPress={onConfirmSync}
            >
              {t('scantastic.confirmation.button.continue')}
            </Button>
          </Flex>
          <TouchableArea alignItems="center" onPress={onClose}>
            <Text color="$accent1" py="$spacing16" variant="buttonLabel1">
              {t('common.button.cancel')}
            </Text>
          </TouchableArea>
        </Flex>
      </Flex>
    </Modal>
  )
}

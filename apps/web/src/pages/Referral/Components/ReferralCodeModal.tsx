import { Dialog } from 'components/Dialog/Dialog'
import StatusIcon from 'components/Identicon/StatusIcon'
import { useAccount } from 'hooks/useAccount'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { REFERRAL_API_APPLY_URL } from 'pages/Referral/Constants/url'
import { useEffect, useState } from 'react'
import { CheckCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Flex, Input, ModalCloseIcon, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIcon, getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'

export function ReferralCodeModal({
  isOpen,
  onClose,
  initialCode,
  inviteeDiscountRate,
  onApplied,
}: {
  isOpen: boolean
  onClose: () => void
  initialCode?: string
  inviteeDiscountRate?: number
  onApplied?: () => void
}) {
  const account = useAccount()
  const { address } = account
  const signer = useEthersSigner()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code, setCode] = useState(initialCode || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const inviteeDiscountPercent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    (inviteeDiscountRate ?? 0) * 100,
  )

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
    }
  }, [initialCode])

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(undefined)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!code || !address || !signer) {
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const timestamp = Date.now()
      const message = t('referral.modal.signMessage', { code, address, timestamp })

      const signature = await signer.signMessage(message)

      const response = await fetch(REFERRAL_API_APPLY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          referralCode: code,
          signature,
          message,
          timestamp,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('referralCode', code)
        onApplied?.()
        onClose()
        setIsSuccessDialogOpen(true)
      } else {
        setErrorMessage(data.error || t('referral.modal.applyError'))
      }
    } catch (error) {
      setErrorMessage(t('referral.modal.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        icon={<CheckCircle size={20} color="currentColor" />}
        title={t('referral.successModal.title')}
        subtext={t('referral.successModal.description', { discount: inviteeDiscountPercent })}
        modalName={ModalName.Dialog}
        primaryButtonText={t('referral.startTrading')}
        primaryButtonOnClick={() => {
          setIsSuccessDialogOpen(false)
          navigate('/swap')
        }}
        hasIconBackground
        showCloseIcon
      />
      <Modal name={ModalName.ReferralCode} isModalOpen={isOpen} onClose={onClose}>
        <Flex gap="$spacing24" p="$spacing12">
          <Flex row justifyContent="space-between" alignItems="flex-start">
            <Flex shrink>
              <Text variant="heading3">{t('referral.modal.title')}</Text>
            </Flex>
            <ModalCloseIcon onClose={onClose} />
          </Flex>

          <Text variant="body2" color="$neutral2">
            {t('referral.modal.description')}
          </Text>

          <Flex gap="$spacing8">
            <Input
              placeholder={t('referral.modal.inputPlaceholder')}
              placeholderTextColor="$neutral2"
              value={code}
              onChangeText={(value) => {
                setCode(value)
                setErrorMessage(undefined)
              }}
              autoFocus
              backgroundColor="$surface2"
              borderColor="$surface3"
              borderRadius="$rounded12"
              borderWidth="$spacing1"
              fontSize={20}
              height={52}
              pl={12}
              py="$spacing12"
            />

            {errorMessage ? (
              <Flex
                row
                alignItems="center"
                justifyContent="center"
                gap="$spacing8"
                p="$spacing12"
                backgroundColor={getWarningIconColors(WarningSeverity.High).backgroundColor}
                borderRadius="$rounded16"
              >
                {(() => {
                  const WarningIcon = getWarningIcon(WarningSeverity.High)
                  const { color, textColor } = getWarningIconColors(WarningSeverity.High)

                  return (
                    <>
                      {WarningIcon ? <WarningIcon color={color} size="$icon.20" /> : null}
                      <Text color={textColor} variant="body3" textAlign="center">
                        {errorMessage}
                      </Text>
                    </>
                  )
                })()}
              </Flex>
            ) : null}

            <Flex
              row
              alignItems="center"
              gap="$spacing12"
              p="$spacing16"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
            >
              <StatusIcon size={32} address={address} />
              <Text variant="body2">{address ? shortenAddress(address) : t('referral.modal.noWalletConnected')}</Text>
            </Flex>
          </Flex>

          <Button
            variant="branded"
            emphasis="primary"
            width="100%"
            size="large"
            p="$spacing24"
            isDisabled={!code || !signer || isLoading}
            onPress={handleConfirm}
          >
            {isLoading ? t('referral.modal.confirming') : t('referral.modal.confirm')}
          </Button>
        </Flex>
      </Modal>
    </>
  )
}

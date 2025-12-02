import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, UniversalImage } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCloseIfConsented } from 'wallet/src/components/smartWallet/modals/hooks/useCloseIfConsented'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'
import { SmartWalletIcon } from 'wallet/src/components/smartWallet/SmartWalletIcon'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

const IMAGE_SIZE: number = 48

export interface SmartWalletNudgeProps {
  isOpen: boolean
  onClose: () => void
  onEnableSmartWallet?: () => void
  dappInfo?: {
    icon?: string
    name?: string
  }
}

export type SmartWalletNudgeState = Omit<SmartWalletNudgeProps, 'onClose' | 'isOpen'>

export function SmartWalletNudge({
  isOpen,
  onClose,
  onEnableSmartWallet,
  dappInfo,
}: SmartWalletNudgeProps): JSX.Element {
  const { t } = useTranslation()

  const address = useActiveAccount()?.address

  const handlePrimaryButtonOnClick = useCallback(() => {
    if (!address) {
      return
    }

    onEnableSmartWallet?.()
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletEnabled })
  }, [onEnableSmartWallet, address])

  const handleSecondaryButtonOnClick = useCallback(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletNotNow })
    onClose()
  }, [onClose])

  useCloseIfConsented({
    onClose,
  })

  const fallback = dappInfo?.name ? <DappIconPlaceholder iconSize={IMAGE_SIZE} name={dappInfo.name} /> : undefined

  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={
        dappInfo?.icon || dappInfo?.name ? (
          <Flex row centered position="relative">
            <Flex height={IMAGE_SIZE} width={IMAGE_SIZE}>
              {dappInfo.icon ? (
                <UniversalImage
                  fallback={fallback}
                  size={{ height: IMAGE_SIZE, width: IMAGE_SIZE }}
                  style={{
                    image: { borderRadius: borderRadii.rounded12, zIndex: 2 },
                    loadingContainer: {
                      borderRadius: borderRadii.rounded12,
                      overflow: 'hidden',
                    },
                  }}
                  uri={dappInfo.icon}
                />
              ) : (
                fallback
              )}
            </Flex>
            <SmartWalletIcon isFullyRounded />
          </Flex>
        ) : (
          <SmartWalletIcon />
        )
      }
      title={dappInfo ? t('smartWallets.postSwapNudge.title.dapp') : t('smartWallets.postSwapNudge.title')}
      subtext={t('smartWallets.educationalModal.description')}
      secondaryButton={{ text: t('common.button.notNow'), onClick: handleSecondaryButtonOnClick }}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.SmartWalletNudge}
      primaryButton={{ text: t('smartWallets.postSwapNudge.enable'), onClick: handlePrimaryButtonOnClick }}
      onClose={onClose}
    />
  )
}

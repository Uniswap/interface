import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, UniversalImage } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'
import { borderRadii } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { useCloseIfConsented } from 'wallet/src/components/smartWallet/modals/hooks/useCloseIfConsented'
import { SmartWalletModal } from 'wallet/src/features/smartWallet/modals/SmartWalletModal'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

const IMAGE_SIZE: number = 48

export interface PostSwapSmartWalletNudgeProps {
  isOpen: boolean
  onClose: () => void
  onEnableSmartWallet?: () => void
  dappInfo?: {
    icon?: string
    name?: string
  }
}

export type PostSwapSmartWalletNudgeState = Omit<PostSwapSmartWalletNudgeProps, 'onClose' | 'isOpen'>

export function PostSwapSmartWalletNudge({
  isOpen,
  onClose,
  onEnableSmartWallet,
  dappInfo,
}: PostSwapSmartWalletNudgeProps): JSX.Element {
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

  const SmartWalletIcon = useMemo(
    () => (
      <Flex
        backgroundColor="$accent2"
        borderRadius="$roundedFull"
        height="$spacing48"
        width={IMAGE_SIZE}
        alignItems="center"
        justifyContent="center"
        mb="$spacing4"
        position="relative"
        ml={-(IMAGE_SIZE / 6)}
      >
        <SmartWallet color="$accent1" size="$icon.24" />
      </Flex>
    ),
    [],
  )

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
                    image: { borderRadius: borderRadii.roundedFull, zIndex: 2 },
                    loadingContainer: {
                      borderRadius: borderRadii.roundedFull,
                      overflow: 'hidden',
                    },
                  }}
                  uri={dappInfo.icon}
                />
              ) : (
                fallback
              )}
            </Flex>
            {SmartWalletIcon}
          </Flex>
        ) : (
          SmartWalletIcon
        )
      }
      title={dappInfo ? t('smartWallets.postSwapNudge.title.dapp') : t('smartWallets.postSwapNudge.title')}
      subtext={t('smartWallets.educationalModal.description')}
      secondaryButtonText={t('common.button.notNow')}
      secondaryButtonOnClick={handleSecondaryButtonOnClick}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.PostSwapSmartWalletNudge}
      primaryButtonText={t('smartWallets.postSwapNudge.enable')}
      primaryButtonOnClick={handlePrimaryButtonOnClick}
      onClose={onClose}
    />
  )
}

import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, QRCodeDisplay, Text, TouchableArea, useIsShortMobileDevice, useMedia, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SupportedNetworkLogosModal } from 'uniswap/src/components/network/SupportedNetworkLogosModal'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isExtensionApp, isWebApp, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function ReceiveQRCode({ address }: { address: Address }): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const media = useMedia()
  const dispatch = useDispatch()
  const addressColor = useAddressColorProps(address)
  const { chains: enabledChainIds } = useEnabledChains({
    platform: isEVMAddress(address) ? Platform.EVM : Platform.SVM,
  })
  const isShortMobileDevice = useIsShortMobileDevice()

  const QR_CODE_SIZE = media.short ? 220 : 240
  const UNICON_SIZE = QR_CODE_SIZE / 4

  const { useWalletDisplayName } = useUniswapContext()
  const displayName = useWalletDisplayName(address, { includeUnitagSuffix: true })
  const displayHeaderAddress = displayName?.type === DisplayNameType.Address

  const platformAddressLabel = isWebApp
    ? (isEVMAddress(address) ? MAINNET_CHAIN_INFO.name : SOLANA_CHAIN_INFO.name) +
      ' ' +
      t('common.address').toLowerCase()
    : t('common.walletAddress')

  const { value: copied, setTrue: setCopiedTrue, setFalse: setCopiedFalse } = useBooleanState(false)

  const onPressCopyAddress = useEvent(async (): Promise<void> => {
    await setClipboard(address)
    setCopiedTrue()

    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    setTimeout(() => {
      setCopiedFalse()
    }, 400)
  })

  const {
    value: isShowingSupportedNetworksModal,
    setTrue: openSupportedNetworksModal,
    setFalse: closeSupportedNetworksModal,
  } = useBooleanState(false)

  return (
    <>
      <Flex
        grow
        $short={{ mb: spacing.none }}
        alignItems="center"
        animation="quick"
        gap="$spacing12"
        justifyContent={isWebPlatform ? 'flex-start' : 'center'}
        mb="$spacing8"
        px={isWebPlatform || isShortMobileDevice ? '$spacing16' : '$spacing60'}
        py={isExtensionApp ? '$spacing60' : '$spacing24'}
      >
        <Flex>
          {displayHeaderAddress ? (
            <Text color="$neutral1" numberOfLines={1} variant="heading3">
              {platformAddressLabel}
            </Text>
          ) : (
            <AddressDisplay
              includeUnitagSuffix
              centered
              hideAddressInSubtitle
              disableForcedWidth
              address={address}
              captionVariant="body2"
              showAccountIcon={false}
              variant="heading3"
            />
          )}
        </Flex>
        <QRCodeDisplay
          color={addressColor}
          containerBackgroundColor={colors.surface1.val}
          encodedValue={address}
          size={QR_CODE_SIZE}
        >
          <Flex
            justifyContent="center"
            alignItems="center"
            p="$spacing4"
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
          >
            <AccountIcon size={UNICON_SIZE} address={address} />
          </Flex>
        </QRCodeDisplay>
        <TouchableArea width="100%" hoverStyle={{ opacity: 0.75 }} onPress={onPressCopyAddress}>
          <Flex position="relative" width="100%" mt="$spacing8">
            <Flex
              width="100%"
              pt="$spacing20"
              pb="$spacing16"
              px="$spacing16"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              borderColor="$surface3"
            >
              <Text color="$neutral1" textAlign="center" variant="body2" width="100%">
                {address}
              </Text>
            </Flex>
            <Flex
              row
              position="absolute"
              top={-8}
              left={0}
              right={0}
              backgroundColor="transparent"
              justifyContent="center"
            >
              <Flex row backgroundColor="$surface1" alignItems="center" gap="$spacing4" px="$spacing8">
                <Text color="$neutral2" variant="body4">
                  {platformAddressLabel}
                </Text>
                {copied ? (
                  <CheckmarkCircle color="$statusSuccess" size="$icon.16" />
                ) : (
                  <CopySheets color="$neutral2" size="$icon.16" />
                )}
              </Flex>
            </Flex>
          </Flex>
        </TouchableArea>
        <TouchableArea gap="$gap4" mt="$spacing4" onPress={openSupportedNetworksModal}>
          <Text variant="body3">{t('fiatOnRamp.receiveCrypto.useThisAddress')}</Text>
          <Flex row centered gap="$gap4">
            {isEVMAddress(address) ? (
              <>
                <NetworkLogo chainId={null} size={iconSizes.icon20} />
                <Text variant="buttonLabel3">
                  {enabledChainIds.length} {t('extension.connection.networks').toLowerCase()}
                </Text>
              </>
            ) : (
              <>
                <NetworkLogo chainId={UniverseChainId.Solana} size={iconSizes.icon20} />
                <Text variant="buttonLabel3">{SOLANA_CHAIN_INFO.name}</Text>
              </>
            )}
            <InfoCircleFilled color="$neutral3" size="$icon.12" />
          </Flex>
        </TouchableArea>
      </Flex>

      <SupportedNetworkLogosModal
        chains={enabledChainIds}
        isShowingModal={isShowingSupportedNetworksModal}
        closeModal={closeSupportedNetworksModal}
      />
    </>
  )
}

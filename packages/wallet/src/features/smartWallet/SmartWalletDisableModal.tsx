import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { GlobeFilled, InfoCircle, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes, spacing, zIndexes } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ActiveNetworkExpando } from 'wallet/src/features/smartWallet/ActiveNetworkExpando/ActiveNetworkExpando'
import { useEnabledActiveNetworkDelegations } from 'wallet/src/features/smartWallet/hooks/useEnabledActiveNetworkDelegations'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import { WalletData } from 'wallet/src/features/smartWallet/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

interface SmartWalletDisableModalProps {
  wallet: WalletData
  onClose: () => void
  onConfirm: () => void
  isOpen?: boolean
}

export function SmartWalletDisableModal({
  wallet,
  onClose,
  onConfirm,
  isOpen,
}: SmartWalletDisableModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const getTranslatedStatus = useTranslateSmartWalletStatus()

  const {
    value: isActiveNetworksExpanded,
    toggle: toggleActiveNetworksCollapsed,
    setFalse: collapseActiveNetworks,
  } = useBooleanState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: -wallet
  useEffect(() => {
    collapseActiveNetworks()
  }, [collapseActiveNetworks, wallet])

  const activeDelegations = useEnabledActiveNetworkDelegations(wallet.activeDelegationNetworkToAddress)

  const { walletAddress } = wallet
  const displayName = useDisplayName(walletAddress)

  return (
    <Modal
      isModalOpen={isOpen}
      maxHeight={isMobileApp ? '100%' : undefined}
      alignment="top"
      name={ModalName.SmartWalletDisableModal}
      onClose={onClose}
    >
      <Flex
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        overflow="hidden"
        gap="$gap16"
        px={isMobileApp ? '$spacing24' : undefined}
        mb={isMobileApp ? '$spacing36' : undefined}
        pt={isMobileApp ? '$none' : undefined}
        maxHeight="100%"
        {...(isWebPlatform && { flex: 1, overflowY: 'hidden' })}
      >
        <Flex row alignItems="center" gap="$spacing12">
          <AccountIcon address={walletAddress} size={iconSizes.icon40} />
          <Flex>
            <Text variant="body2">{t('settings.setting.smartWallet.action.smartWallet')}</Text>
            <Text variant="body3" color="$accent1">
              {getTranslatedStatus(wallet.status)}
            </Text>
          </Flex>
        </Flex>

        <Separator />

        <Flex row justifyContent="space-between">
          <Flex row>
            <WarningInfo
              infoButton={
                <LearnMoreLink
                  textVariant="buttonLabel4"
                  textColor={isWebPlatform ? '$accent1' : '$accent3'}
                  url={uniswapUrls.helpArticleUrls.multichainDelegation}
                />
              }
              trigger={<InfoCircle alignSelf="flex-start" color="$neutral3" size="$icon.16" />}
              modalProps={{
                caption: t('smartWallets.activeNetworks.description'),
                rejectText: t('common.button.close'),
                modalName: ModalName.NetworkFeeInfo,
                severity: WarningSeverity.None,
                icon: <GlobeFilled size="$icon.24" />,
                title: t('common.activeNetworks'),
                zIndex: zIndexes.popover,
              }}
              tooltipProps={{
                text: <Text variant="body4">{t('smartWallets.activeNetworks.description')}</Text>,
                placement: 'top',
              }}
            >
              <Text variant="body3" color="$neutral2" marginEnd="$spacing1">
                {t('common.activeNetworks')}
              </Text>
            </WarningInfo>
          </Flex>

          {activeDelegations.length > 0 ? (
            <TouchableArea
              justifyContent="center"
              flexDirection="row"
              gap="$gap4"
              onPress={toggleActiveNetworksCollapsed}
            >
              <Text variant="body3">{activeDelegations.length}</Text>
              <RotatableChevron
                color="$neutral3"
                direction={isActiveNetworksExpanded ? 'up' : 'down'}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            </TouchableArea>
          ) : (
            <Text variant="body3">{activeDelegations.length}</Text>
          )}
        </Flex>

        <ActiveNetworkExpando
          isOpen={isActiveNetworksExpanded}
          activeDelegations={activeDelegations}
          // cancel out gap when collapsed to avoid extra space
          mt={isActiveNetworksExpanded ? undefined : -spacing.spacing16}
        />

        <Flex row justifyContent="space-between" mb="$spacing8">
          <Text variant="body3" color="$neutral2">
            {t('common.wallet.label')}
          </Text>
          <Flex row alignItems="center" gap="$spacing4">
            <AccountIcon address={walletAddress} size={iconSizes.icon16} />
            <DisplayNameText
              gap="$spacing4"
              displayName={displayName}
              textProps={{ variant: 'body3', color: '$neutral1' }}
              unitagIconSize="$icon.18"
            />
          </Flex>
        </Flex>
        <Flex row>
          <Button fill size="medium" emphasis="secondary" onPress={onConfirm}>
            {t('common.button.disable')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

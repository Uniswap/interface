import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import Checkmark from 'src/assets/icons/checkmark.svg'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { AppBackground } from 'src/components/gradients'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { PendingConnectionSwitchNetworkModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchNetworkModal'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { settlePendingSession } from 'src/features/walletConnect/WalletConnect'
import {
  removePendingSession,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'
import { opacify } from 'src/utils/colors'
import { openUri } from 'src/utils/linking'

type Props = {
  pendingSession: WalletConnectSession
  onClose: () => void
}

export const PendingConnection = ({ pendingSession, onClose }: Props) => {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const dispatch = useAppDispatch()

  const [showSwitchNetworkModal, setShowSwitchNetworkModal] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<ChainId>(ChainId.Mainnet)

  useEffect(() => {
    if (pendingSession) {
      const dappChain = toSupportedChainId(pendingSession.dapp.chain_id)
      if (dappChain) setSelectedChainId(dappChain)
    }
  }, [pendingSession])

  const onPressSettleConnection = useCallback(
    (approved: boolean) => {
      if (!activeAddress) return
      selectionAsync()
      settlePendingSession(selectedChainId, activeAddress, approved)
      if (approved) {
        onClose()
      } else {
        dispatch(removePendingSession())
      }
    },
    [activeAddress, dispatch, onClose, selectedChainId]
  )

  return (
    <>
      <AppBackground />
      <Flex backgroundColor="translucentBackground" flex={1} gap="none" px="xl" py="xxl">
        <Flex centered flex={1} gap="xxs">
          <Box>
            <RemoteImage
              borderRadius={theme.borderRadii.full}
              height={48}
              imageUrl={pendingSession.dapp.icon}
              width={48}
            />
          </Box>
          <Flex
            alignItems="center"
            borderRadius="sm"
            flexDirection="row"
            gap="xxs"
            justifyContent="center"
            p="xxs"
            style={{
              backgroundColor: opacify(8, theme.colors.accentBackgroundActive),
            }}>
            <Button onPress={() => openUri(pendingSession.dapp.url)}>
              <Text color={'accentBackgroundActive'} variant="caption">
                {pendingSession.dapp.url}
              </Text>
            </Button>
          </Flex>
          <Flex gap="none" px="md">
            <Text textAlign="center" variant="h3">
              {t('"{{dappName}}" wants to connect to your wallet', {
                dappName: pendingSession.dapp.name,
              })}
            </Text>
          </Flex>
        </Flex>
        <Flex
          backgroundColor="neutralContainer"
          borderColor="lightBorder"
          borderTopLeftRadius="lg"
          borderTopRightRadius="lg"
          borderWidth={1}
          m="none"
          p="md">
          <Text color="neutralTextSecondary">{t('Site permissions')}</Text>
          <Text color="neutralTextPrimary">
            <Box pr="xs">
              <Checkmark color={theme.colors.accentBackgroundSuccess} height={11} width={11} />
            </Box>
            {t('View your wallet address and ENS name')}
          </Text>
          <Text color="neutralTextPrimary">
            <Box pr="xs">
              <Checkmark color={theme.colors.accentBackgroundSuccess} height={11} width={11} />
            </Box>
            {t('View your token balances')}
          </Text>
          <Text color="neutralTextPrimary">
            <Box pr="xs">
              <X color={theme.colors.accentBackgroundFailure} height={11} width={11} />
            </Box>
            {t('Transfer your assets without your consent')}
          </Text>
        </Flex>
        <Button
          m="none"
          name={ElementName.WCDappSwitchNetwork}
          p="none"
          onPress={() => setShowSwitchNetworkModal(true)}>
          <Flex
            row
            shrink
            backgroundColor="neutralContainer"
            borderBottomLeftRadius="lg"
            borderBottomRightRadius="lg"
            borderColor="lightBorder"
            borderTopWidth={0}
            borderWidth={1}
            gap="sm"
            justifyContent="space-between"
            m="none"
            p="sm">
            <Flex row shrink gap="xs">
              <NetworkLogo chainId={selectedChainId} size={20} />
              <Text color="deprecated_gray600" variant="body2">
                {CHAIN_INFO[selectedChainId].label}
              </Text>
            </Flex>
            <Chevron
              color={theme.colors.neutralTextTertiary}
              direction="e"
              height="10"
              width="13"
            />
          </Flex>
        </Button>
        <Flex flexDirection="row" gap="sm" justifyContent="space-between" py="lg">
          <TextButton
            alignItems="center"
            backgroundColor="translucentBackground"
            borderRadius="xl"
            flex={1}
            flexDirection="row"
            justifyContent="center"
            px="md"
            py="sm"
            textAlign="center"
            textVariant="mediumLabel"
            onPress={() => onPressSettleConnection(false)}>
            {t('Cancel')}
          </TextButton>
          <PrimaryButton
            borderRadius="lg"
            flex={1}
            label={t('Connect')}
            variant="blue"
            onPress={() => onPressSettleConnection(true)}
          />
        </Flex>
      </Flex>
      {showSwitchNetworkModal && (
        <PendingConnectionSwitchNetworkModal
          pendingSession={pendingSession}
          selectedChainId={selectedChainId}
          onClose={() => setShowSwitchNetworkModal(false)}
          onPressChain={(chainId) => {
            selectionAsync()
            setSelectedChainId(chainId)
            setShowSwitchNetworkModal(false)
          }}
          onPressDisconnect={() => {
            onPressSettleConnection(false)
            setShowSwitchNetworkModal(false)
          }}
        />
      )}
    </>
  )
}

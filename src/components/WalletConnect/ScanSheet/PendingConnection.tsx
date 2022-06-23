import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import Checkmark from 'src/assets/icons/checkmark.svg'
import X from 'src/assets/icons/x.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { AppBackground } from 'src/components/gradients'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { HeaderIcon } from 'src/components/WalletConnect/RequestModal/HeaderIcon'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { PendingConnectionSwitchNetworkModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchNetworkModal'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { settlePendingSession } from 'src/features/walletConnect/WalletConnect'
import {
  removePendingSession,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { shortenAddress } from 'src/utils/addresses'
import { toSupportedChainId } from 'src/utils/chainId'

type Props = {
  pendingSession: WalletConnectSession
  onClose: () => void
}

enum PendingConnectionModalState {
  Hidden,
  SwitchNetwork,
  SwitchAccount,
}

const SitePermissions = () => {
  const theme = useAppTheme()
  const { t } = useTranslation()

  return (
    <Flex gap="sm" p="md">
      <Text color="textSecondary">{t('Site permissions')}</Text>
      <Flex row alignItems="center" gap="xs">
        <Checkmark color={theme.colors.accentSuccess} height={11} width={11} />
        <Box>
          <Text color="textPrimary">{t('View your wallet address and ENS name')}</Text>
        </Box>
      </Flex>
      <Flex row alignItems="center" gap="xs">
        <Checkmark color={theme.colors.accentSuccess} height={11} width={11} />
        <Box>
          <Text color="textPrimary">{t('View your token balances')}</Text>
        </Box>
      </Flex>
      <Flex row alignItems="center" gap="xs">
        <X color={theme.colors.accentFailure} height={11} width={11} />
        <Box>
          <Text color="textPrimary">{t('Transfer your assets without your consent')}</Text>
        </Box>
      </Flex>
    </Flex>
  )
}

type SwitchNetworkProps = {
  selectedChainId: ChainId
  onPress: () => void
}

const SwitchNetworkRow = ({ onPress, selectedChainId }: SwitchNetworkProps) => {
  const theme = useAppTheme()

  return (
    <Button m="none" name={ElementName.WCDappSwitchNetwork} p="none" onPress={onPress}>
      <Flex row shrink alignItems="center" gap="sm" justifyContent="space-between" p="sm">
        <Flex row shrink gap="sm">
          <NetworkLogo chainId={selectedChainId} size={20} />
          <Text color="textPrimary" variant="body2">
            {CHAIN_INFO[selectedChainId].label}
          </Text>
        </Flex>
        <Chevron color={theme.colors.textTertiary} direction="e" height="10" width="13" />
      </Flex>
    </Button>
  )
}

type SwitchAccountProps = {
  activeAddress: string
  onPress: () => void
}

const SwitchAccountRow = ({ activeAddress, onPress }: SwitchAccountProps) => {
  const theme = useAppTheme()

  return (
    <Button m="none" name={ElementName.WCDappSwitchAccount} p="none" onPress={onPress}>
      <Flex row shrink gap="sm" justifyContent="space-between" p="sm">
        <AddressDisplay
          address={activeAddress}
          showNotificationBadge={false}
          size={20}
          variant="body2"
          verticalGap="none"
        />
        <Flex centered row shrink gap="xs">
          <Text color="textSecondary" variant="body2">
            {shortenAddress(activeAddress)}
          </Text>
          <Chevron color={theme.colors.textTertiary} direction="e" height="10" width="13" />
        </Flex>
      </Flex>
    </Button>
  )
}

export const PendingConnection = ({ pendingSession, onClose }: Props) => {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()

  const [modalState, setModalState] = useState<PendingConnectionModalState>(
    PendingConnectionModalState.Hidden
  )
  const [selectedChainId, setSelectedChainId] = useState<ChainId>(ChainId.Mainnet)

  useEffect(() => {
    if (pendingSession) {
      const dappChain = toSupportedChainId(pendingSession.dapp.chain_id)
      if (dappChain) setSelectedChainId(dappChain)
    }
  }, [pendingSession])

  const onPressSettleConnection = useCallback(
    (approved: boolean) => {
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
      <AnimatedFlex
        backgroundColor="translucentBackground"
        borderRadius="md"
        flex={1}
        gap="lg"
        overflow="hidden"
        px="lg"
        py="xxxl">
        <AppBackground />
        <Flex alignItems="center" flex={1} gap="md" justifyContent="flex-end">
          <Box>
            <HeaderIcon dapp={pendingSession.dapp} showChain={false} />
          </Box>
          <Text textAlign="center" variant="h3">
            <Trans t={t}>
              <Text fontWeight="bold">{{ dapp: pendingSession.dapp.name }}</Text> wants to connect
              to your wallet
            </Trans>
          </Text>
          <LinkButton
            backgroundColor="translucentBackground"
            borderRadius="xs"
            label={pendingSession.dapp.url}
            mb="sm"
            px="xs"
            py="xxs"
            textVariant="caption"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex bg="translucentBackground" borderRadius="lg" gap="xxxs">
          <SitePermissions />
          <Separator />
          <SwitchNetworkRow
            selectedChainId={selectedChainId}
            onPress={() => setModalState(PendingConnectionModalState.SwitchNetwork)}
          />
          <Separator />
          <SwitchAccountRow
            activeAddress={activeAddress}
            onPress={() => setModalState(PendingConnectionModalState.SwitchAccount)}
          />
          <Box />
        </Flex>
        <Flex flexDirection="row" gap="xs" justifyContent="space-between">
          <TextButton
            alignItems="center"
            backgroundColor="translucentBackground"
            borderRadius="md"
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
            borderRadius="md"
            flex={1}
            label={t('Connect')}
            variant="blue"
            onPress={() => onPressSettleConnection(true)}
          />
        </Flex>
      </AnimatedFlex>
      {modalState === PendingConnectionModalState.SwitchNetwork && (
        <PendingConnectionSwitchNetworkModal
          selectedChainId={selectedChainId}
          onClose={() => setModalState(PendingConnectionModalState.Hidden)}
          onPressChain={(chainId) => {
            setSelectedChainId(chainId)
            setModalState(PendingConnectionModalState.Hidden)
          }}
        />
      )}
      {modalState === PendingConnectionModalState.SwitchAccount && (
        <PendingConnectionSwitchAccountModal
          activeAccount={activeAccount}
          onClose={() => setModalState(PendingConnectionModalState.Hidden)}
          onPressAccount={(account) => {
            dispatch(activateAccount(account.address))
            setModalState(PendingConnectionModalState.Hidden)
          }}
        />
      )}
    </>
  )
}

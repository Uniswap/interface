import React, { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import Checkmark from 'src/assets/icons/check.svg'
import X from 'src/assets/icons/x.svg'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { HeaderIcon } from 'src/components/WalletConnect/RequestModal/HeaderIcon'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { PendingConnectionSwitchNetworkModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchNetworkModal'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, EventName } from 'src/features/telemetry/constants'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useSignerAccounts,
} from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { WCEventType, WCRequestOutcome } from 'src/features/walletConnect/types'
import { settlePendingSession } from 'src/features/walletConnect/WalletConnect'
import {
  removePendingSession,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
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
      <Text color="textSecondary" variant="subheadSmall">
        {t('App permissions')}
      </Text>
      <Flex row alignItems="flex-start" gap="xs">
        <Box mt="xxxs">
          <Checkmark color={theme.colors.accentSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('View your wallet address and ENS name')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="xs">
        <Box mt="xxxs">
          <Checkmark color={theme.colors.accentSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('View your token balances')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="xs">
        <Box mt="xxxs">
          <X color={theme.colors.accentCritical} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('Transfer your assets without consent')}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}

type SwitchNetworkProps = {
  selectedChainId: ChainId
  setModalState: (state: PendingConnectionModalState.SwitchNetwork) => void
}

const SwitchNetworkRow = ({ selectedChainId, setModalState }: SwitchNetworkProps) => {
  const theme = useAppTheme()

  const onPress = useCallback(() => {
    setModalState(PendingConnectionModalState.SwitchNetwork)
  }, [setModalState])

  return (
    <TouchableArea m="none" name={ElementName.WCDappSwitchNetwork} p="none" onPress={onPress}>
      <Flex row shrink alignItems="center" gap="sm" justifyContent="space-between" p="sm">
        <Flex row shrink gap="sm">
          <NetworkLogo chainId={selectedChainId} />
          <Text color="textPrimary" variant="subheadSmall">
            {CHAIN_INFO[selectedChainId].label}
          </Text>
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height="20" width="20" />
      </Flex>
    </TouchableArea>
  )
}

type SwitchAccountProps = {
  activeAddress: string
  setModalState: (state: PendingConnectionModalState.SwitchAccount) => void
}

const SwitchAccountRow = ({ activeAddress, setModalState }: SwitchAccountProps) => {
  const signerAccounts = useSignerAccounts()
  const accountIsSwitchable = signerAccounts.length > 1

  const onPress = useCallback(() => {
    setModalState(PendingConnectionModalState.SwitchAccount)
  }, [setModalState])

  return (
    <TouchableArea
      disabled={!accountIsSwitchable}
      m="none"
      name={ElementName.WCDappSwitchAccount}
      p="sm"
      onPress={onPress}>
      <AccountDetails address={activeAddress} chevron={accountIsSwitchable} />
    </TouchableArea>
  )
}

export const PendingConnection = ({ pendingSession, onClose }: Props) => {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
      settlePendingSession(selectedChainId, activeAddress, approved)

      sendAnalyticsEvent(EventName.WalletConnectSheetCompleted, {
        request_type: WCEventType.SessionPending,
        dapp_url: pendingSession.dapp.url,
        dapp_name: pendingSession.dapp.name,
        chain_id: pendingSession.dapp.chain_id,
        outcome: approved ? WCRequestOutcome.Confirm : WCRequestOutcome.Reject,
      })

      if (approved) {
        onClose()
      } else {
        dispatch(removePendingSession())
      }
    },
    [activeAddress, dispatch, onClose, selectedChainId, pendingSession]
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
        <Flex alignItems="center" flex={1} gap="md" justifyContent="flex-end">
          <HeaderIcon dapp={pendingSession.dapp} showChain={false} />
          <Text textAlign="center" variant="headlineSmall">
            <Trans t={t}>
              <Text fontWeight="bold">{{ dapp: pendingSession.dapp.name }}</Text> wants to connect
              to your wallet
            </Trans>
          </Text>
          <LinkButton
            backgroundColor="accentActiveSoft"
            borderRadius="sm"
            color={theme.colors.accentActive}
            label={pendingSession.dapp.url}
            mb="sm"
            p="xs"
            textVariant="buttonLabelMicro"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex bg="translucentBackground" borderRadius="lg" gap="xxxs">
          <SitePermissions />
          <Separator />
          <SwitchNetworkRow selectedChainId={selectedChainId} setModalState={setModalState} />
          <Separator />
          <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
          <Box />
        </Flex>
        <Flex flexDirection="row" gap="xs" justifyContent="space-between">
          <Button
            fill
            emphasis={ButtonEmphasis.Secondary}
            label={t('Cancel')}
            onPress={() => onPressSettleConnection(false)}
          />
          <Button fill label={t('Connect')} onPress={() => onPressSettleConnection(true)} />
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

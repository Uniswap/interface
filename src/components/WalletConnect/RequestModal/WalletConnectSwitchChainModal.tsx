import React, { useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { confirmSwitchChainRequest, rejectRequest } from 'src/features/walletConnect/WalletConnect'
import { SwitchChainRequest } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

interface Props {
  onClose: () => void
  request: SwitchChainRequest
}

export function WalletConnectSwitchChainModal({ onClose, request }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()

  /**
   * TODO: [MOB-3908] implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  const newChainId = toSupportedChainId(request.newChainId)
  // newChainId should always be non-null because we reject switching to unsupported chains in the WC switch chain handler
  if (!newChainId) return null

  const newChainName = CHAIN_INFO[newChainId].label
  const { dapp } = request

  const onReject = (): void => {
    rejectRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const onConfirm = async (): Promise<void> => {
    confirmSwitchChainRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const handleClose = (): void => {
    if (rejectOnCloseRef.current) {
      onReject()
    } else {
      onClose()
    }
  }

  return (
    <BottomSheetModal name={ModalName.WCSwitchChainRequest} onClose={handleClose}>
      <Flex gap="spacing24" paddingBottom="spacing48" paddingHorizontal="spacing16" pt="spacing36">
        <Flex alignItems="center" gap="spacing16">
          <DappHeaderIcon showChain dapp={{ ...dapp, chain_id: newChainId }} />
          <Text textAlign="center" variant="headlineSmall">
            <Trans t={t}>
              <Text fontWeight="bold">{{ dapp: dapp.name }}</Text> wants to connect to the{' '}
              {newChainName} network
            </Trans>
          </Text>
          <LinkButton
            backgroundColor="background2"
            borderRadius="rounded12"
            color={theme.colors.accentActive}
            iconColor={theme.colors.accentActive}
            label={dapp.url}
            p="spacing8"
            size={theme.iconSizes.icon12}
            textVariant="buttonLabelMicro"
            url={dapp.url}
          />
        </Flex>
        <Flex gap="spacing12">
          <Flex backgroundColor="background2" borderRadius="rounded16" gap="none">
            <Flex row alignItems="center" justifyContent="space-between" p="spacing16">
              <Text variant="subheadSmall">{t('Network')}</Text>
              <InlineNetworkPill chainId={newChainId} />
            </Flex>
            <Separator color="background1" width={1} />
            <Box p="spacing16">
              <AccountDetails address={request.account} />
            </Box>
          </Flex>
          <Flex row gap="spacing12">
            <Button
              fill
              emphasis={ButtonEmphasis.Tertiary}
              label={t('Cancel')}
              name={ElementName.Cancel}
              size={ButtonSize.Medium}
              onPress={onReject}
            />
            <Button
              fill
              label={t('Connect')}
              name={ElementName.Confirm}
              size={ButtonSize.Medium}
              onPress={onConfirm}
            />
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

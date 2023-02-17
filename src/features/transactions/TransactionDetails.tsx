import React, { PropsWithChildren, ReactNode } from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/WarningModal/types'
import { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

const ALERT_ICONS_SIZE = 18

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: ChainId
  gasFee?: string
  gasFallbackUsed?: boolean
  showWarning?: boolean
  warning?: Warning
  onShowWarning?: () => void
  onShowGasWarning?: () => void
}

export function TransactionDetails({
  banner,
  children,
  chainId,
  gasFee,
  gasFallbackUsed,
  showWarning,
  warning,
  onShowGasWarning,
  onShowWarning,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const theme = useAppTheme()
  const userAddress = useActiveAccountAddressWithThrow()
  const warningColor = getAlertColor(warning?.severity)

  return (
    <Box>
      {showWarning && warning && onShowWarning && (
        <TouchableArea mb="spacing8" onPress={onShowWarning}>
          <Flex
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderRadius="rounded16"
            flexGrow={1}
            gap="spacing8"
            px="spacing16"
            py="spacing8">
            <AlertTriangle
              color={theme.colors[warningColor?.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
            <Flex flexGrow={1} py="spacing2">
              <Text color={warningColor.text} variant="subheadSmall">
                {warning.title}
              </Text>
            </Flex>
          </Flex>
        </TouchableArea>
      )}
      <Flex backgroundColor="background2" borderRadius="rounded16" gap="none" padding="spacing8">
        {!showWarning && <Box mb="none">{banner}</Box>}
        {children}
        <NetworkFee
          chainId={chainId}
          gasFallbackUsed={gasFallbackUsed}
          gasFee={gasFee}
          onShowGasWarning={onShowGasWarning}
        />
        <Box px="spacing12" py="spacing8">
          <AccountDetails address={userAddress} iconSize={20} />
        </Box>
      </Flex>
    </Box>
  )
}

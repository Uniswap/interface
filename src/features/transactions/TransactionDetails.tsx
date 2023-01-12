import React, { PropsWithChildren, ReactNode } from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
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
import { Theme } from 'src/styles/theme'

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

export const TRANSACTION_DETAILS_SPACER: { color: keyof Theme['colors']; width: number } = {
  color: 'background1',
  width: 2,
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
}: PropsWithChildren<TransactionDetailsProps>) {
  const theme = useAppTheme()
  const userAddress = useActiveAccountAddressWithThrow()
  const warningColor = getAlertColor(warning?.severity)

  return (
    <Box>
      {showWarning && warning && onShowWarning && (
        <TouchableArea mb="xs" onPress={onShowWarning}>
          <Flex
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderRadius="md"
            flexGrow={1}
            gap="xs"
            p="sm">
            <AlertTriangle
              color={theme.colors[warningColor?.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
            <Flex flexGrow={1} py="xxxs">
              <Text color={warningColor.text} variant="subheadSmall">
                {warning.title}
              </Text>
            </Flex>
            <InfoCircle
              color={theme.colors[warningColor.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
          </Flex>
        </TouchableArea>
      )}
      {!showWarning && <Box mb="xs">{banner}</Box>}
      <Flex backgroundColor="background2" borderRadius="lg" gap="none">
        {children}
        <NetworkFee
          chainId={chainId}
          gasFallbackUsed={gasFallbackUsed}
          gasFee={gasFee}
          onShowGasWarning={onShowGasWarning}
        />
        <Box
          borderTopColor={TRANSACTION_DETAILS_SPACER.color}
          borderTopWidth={TRANSACTION_DETAILS_SPACER.width}
          p="md">
          <AccountDetails address={userAddress} iconSize={24} />
        </Box>
      </Flex>
    </Box>
  )
}

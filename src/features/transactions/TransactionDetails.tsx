import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { Warning } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { ChainId } from 'src/constants/chains'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { formatUSDGasPrice } from 'src/utils/format'

const ALERT_ICONS_SIZE = 18

interface TransactionDetailsProps {
  chainId: ChainId | undefined
  gasFee: string | undefined
  showWarning?: boolean
  warning?: Warning
  onShowWarning?: () => void
}

export const TRANSACTION_DETAILS_SPACER: { color: keyof Theme['colors']; width: number } = {
  color: 'backgroundOutline',
  width: 0.5,
}

export function TransactionDetails({
  children,
  chainId,
  gasFee,
  showWarning,
  warning,
  onShowWarning,
}: PropsWithChildren<TransactionDetailsProps>) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const userAddress = useActiveAccountAddressWithThrow()
  const gasFeeUSD = formatUSDGasPrice(useUSDGasPrice(chainId, gasFee))
  const warningColor = getWarningColor(warning)

  return (
    <Flex backgroundColor="backgroundContainer" borderRadius="lg" gap="none">
      {showWarning && warning && onShowWarning && (
        <Button onPress={onShowWarning}>
          <Flex
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderTopEndRadius="lg"
            borderTopStartRadius="lg"
            flexGrow={1}
            gap="xs"
            p="md">
            <AlertTriangle
              color={theme.colors[warningColor?.text]}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
            <Flex flexGrow={1}>
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
        </Button>
      )}
      {children}
      <Flex
        row
        borderBottomColor={TRANSACTION_DETAILS_SPACER.color}
        borderBottomWidth={TRANSACTION_DETAILS_SPACER.width}
        justifyContent="space-between"
        p="md">
        <Text fontWeight="500" variant="subheadSmall">
          {t('Network fee')}
        </Text>
        {gasFeeUSD ? <Text variant="subheadSmall">{gasFeeUSD}</Text> : <SpinningLoader />}
      </Flex>
      <Box p="md">
        <AccountDetails address={userAddress} iconSize={24} />
      </Box>
    </Flex>
  )
}

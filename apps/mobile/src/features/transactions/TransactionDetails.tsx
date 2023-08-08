import { SwapEventName } from '@uniswap/analytics-events'
import React, { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Separator } from 'src/components/layout/Separator'
import { Warning } from 'src/components/modals/WarningModal/types'
import { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { Text } from 'src/components/Text'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import AnglesMaximize from 'ui/src/assets/icons/angles-maximize.svg'
import AnglesMinimize from 'ui/src/assets/icons/angles-minimize.svg'
import { ChainId } from 'wallet/src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const ALERT_ICONS_SIZE = 18

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: ChainId
  gasFeeUSD?: string
  gasFallbackUsed?: boolean
  showExpandedChildren?: boolean
  showWarning?: boolean
  warning?: Warning
  onShowWarning?: () => void
  onShowGasWarning?: () => void
}

export function TransactionDetails({
  banner,
  children,
  showExpandedChildren,
  chainId,
  gasFeeUSD,
  gasFallbackUsed,
  showWarning,
  warning,
  onShowGasWarning,
  onShowWarning,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const userAddress = useActiveAccountAddressWithThrow()
  const warningColor = getAlertColor(warning?.severity)

  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendMobileAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

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
      <Flex backgroundColor="DEP_background2" borderRadius="rounded16" gap="none">
        {!showWarning && (
          <>
            {banner}
            <Separator color="DEP_background1" width={1} />
          </>
        )}
        <Flex gap="spacing12" px="spacing12" py="spacing12">
          {showChildren ? <Flex gap="spacing12">{children}</Flex> : null}
          <NetworkFee
            chainId={chainId}
            gasFallbackUsed={gasFallbackUsed}
            gasFeeUSD={gasFeeUSD}
            onShowGasWarning={onShowGasWarning}
          />
        </Flex>
        <Separator color="DEP_background1" width={1} />
        <Box px="spacing12" py="spacing12">
          <AccountDetails address={userAddress} iconSize={20} />
        </Box>
      </Flex>
      {children ? (
        <TouchableArea
          alignItems="center"
          flexDirection="row"
          justifyContent="center"
          py="spacing8"
          onPress={onPressToggleShowChildren}>
          <Text color="DEP_textTertiary" variant="bodySmall">
            {showChildren ? t('Show less') : t('Show more')}
          </Text>
          {showChildren ? (
            <AnglesMinimize
              color={theme.colors.DEP_textTertiary}
              height={theme.iconSizes.icon20}
              width={theme.iconSizes.icon20}
            />
          ) : (
            <AnglesMaximize
              color={theme.colors.DEP_textTertiary}
              height={theme.iconSizes.icon20}
              width={theme.iconSizes.icon20}
            />
          )}
        </TouchableArea>
      ) : null}
    </Box>
  )
}

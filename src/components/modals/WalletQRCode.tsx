import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useAppTheme } from 'src/app/hooks'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

interface Props {
  isVisible: boolean
  onClose: () => void
}

export function WalletQRCode({ isVisible, onClose }: Props) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const theme = useAppTheme()

  const onShare = async () => {
    if (!activeAccount) return
    try {
      await Share.share({
        message: activeAccount.address,
      })
    } catch (e) {
      logger.error('WalletQRCode', 'onShare', 'Error sharing account address', e)
    }
  }

  if (!activeAccount) return null

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WalletQRCode} onClose={onClose}>
      <Box alignItems="center" marginBottom="lg" p="lg">
        <Box alignItems="center">
          <Text color="gray400" variant="body">
            {t`Receive funds`}
          </Text>
        </Box>

        <Flex centered flexDirection="row" gap="xs">
          <Identicon address={activeAccount?.address ?? NULL_ADDRESS} size={24} />

          <Text color="textColor" marginRight="sm" marginVertical="md" variant="bodyMd">
            {shortenAddress(activeAccount.address)}
          </Text>
        </Flex>

        <Box
          backgroundColor="white"
          borderRadius="lg"
          marginBottom="lg"
          marginTop="lg"
          padding="lg">
          <QRCode size={200} value={activeAccount.address} />
        </Box>

        <Box flexDirection="row" justifyContent="space-between">
          <PrimaryCopyTextButton
            copyText={activeAccount.address}
            flex={1}
            icon={<CopySheets height={18} stroke={theme.colors.textColor} width={18} />}
            label={t`Copy`}
            variant="gray"
          />
          <PrimaryButton
            flex={1}
            icon={<ShareIcon height={18} stroke="white" width={18} />}
            label={t`Share`}
            marginLeft="sm"
            onPress={onShare}
          />
        </Box>
      </Box>
    </BottomSheetModal>
  )
}

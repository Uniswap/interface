import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useAppTheme } from 'src/app/hooks'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'

interface Props {
  address?: Address
  isVisible: boolean
  onClose: () => void
}

export function WalletQRCode({ address, isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const onShare = async () => {
    if (!address) return
    try {
      await Share.share({
        message: address,
      })
    } catch (e) {
      logger.error('WalletQRCode', 'onShare', 'Error sharing account address', e)
    }
  }

  if (!address) return null

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WalletQRCode} onClose={onClose}>
      <Box alignItems="center" marginBottom="lg" p="lg">
        <Flex alignItems="center" gap="sm">
          <Text color="deprecated_gray400" variant="body1">
            {t`Receive funds`}
          </Text>
          <AddressDisplay address={address} variant="body2" />
        </Flex>

        <Box
          backgroundColor="white"
          borderRadius="lg"
          marginBottom="lg"
          marginTop="lg"
          padding="lg">
          <QRCode size={200} value={address} />
        </Box>

        <Box flexDirection="row" justifyContent="space-between">
          <PrimaryCopyTextButton
            copyText={address}
            flex={1}
            icon={<CopySheets color={theme.colors.deprecated_textColor} height={18} width={18} />}
            label={t`Copy`}
            variant="gray"
          />
          <PrimaryButton
            flex={1}
            icon={<ShareIcon color="white" height={18} width={18} />}
            label={t`Share`}
            marginLeft="sm"
            onPress={onShare}
          />
        </Box>
      </Box>
    </BottomSheetModal>
  )
}

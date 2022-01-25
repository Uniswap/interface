import { useTheme } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import QRCodeIcon from 'src/assets/icons/qr-code.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PinkToBlueLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Box } from 'src/components/layout/Box'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

interface Props {
  isVisible: boolean
  onClose: () => void
}

export function WalletQRCode({ isVisible, onClose }: Props) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  if (!activeAccount) return null

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WalletQRCode} onClose={onClose}>
      <Box p="sm">
        <Box alignItems="center" marginTop="sm">
          <Text color="gray400" variant="body">
            {t`Receive funds`}
          </Text>
        </Box>
        <Box
          alignItems="center"
          borderRadius="lg"
          marginVertical="lg"
          overflow="hidden"
          /* forces gradient background to inherit border radius */
          padding="lg"
          position="relative">
          <GradientBackground>
            <PinkToBlueLinear />
          </GradientBackground>

          <Box
            alignItems="flex-end"
            backgroundColor="white"
            borderRadius="md"
            flexDirection="row"
            marginBottom="md"
            marginTop="xs"
            paddingHorizontal="md"
            paddingVertical="xs">
            <WalletIcon fill={theme.colors.black} height={20} width={20} />
            <Text marginLeft="md" variant="h5">
              {t`Wallet`}
            </Text>
          </Box>

          <Box backgroundColor="white" borderRadius="lg" padding="lg">
            <QRCode size={200} value={activeAccount.address} />
          </Box>

          <Box alignItems="center" flexDirection="row">
            <Text marginRight="sm" marginVertical="md">
              {shortenAddress(activeAccount.address)}
            </Text>
            <QRCodeIcon height={15} stroke="gray" width={15} />
          </Box>

          <Box flexDirection="row" justifyContent="space-between">
            <PrimaryCopyTextButton
              copyText={activeAccount.address}
              flex={1}
              icon={<CopySheets height={18} stroke="black" width={18} />}
              label={t`Copy`}
              style={copyButtonStyle}
              textColor="black"
              variant="gray"
            />
            <PrimaryButton
              flex={1}
              icon={<ShareIcon height={18} stroke="white" width={18} />}
              label={t`Share`}
              marginLeft="sm"
            />
          </Box>
        </Box>
      </Box>
    </BottomSheetModal>
  )
}

const copyButtonStyle: StyleProp<ViewStyle> = {
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
}

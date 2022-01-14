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
import { useActiveAccount } from 'src/features/wallet/hooks'
import { TOP_THIRD_SNAP_POINTS } from 'src/styles/bottomSheet'
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
    <BottomSheetModal onClose={onClose} isVisible={isVisible} snapPoints={TOP_THIRD_SNAP_POINTS}>
      <Box backgroundColor="white" justifyContent="center" padding="sm" borderRadius="lg">
        <Box alignItems="center" marginTop="sm">
          <Text color="gray400" variant="body">
            {t`Receive funds`}
          </Text>
        </Box>
        <Box
          position="relative"
          alignItems="center"
          padding="lg"
          borderRadius="lg"
          /* forces gradient background to inherit border radius */
          overflow="hidden"
          marginVertical="lg">
          <GradientBackground>
            <PinkToBlueLinear />
          </GradientBackground>

          <Box
            flexDirection="row"
            alignItems="flex-end"
            marginTop="xs"
            marginBottom="md"
            backgroundColor="white"
            paddingHorizontal="md"
            paddingVertical="xs"
            borderRadius="md">
            <WalletIcon height={20} width={20} fill={theme.colors.black} />
            <Text marginLeft="md" variant="h5">
              {t`Wallet`}
            </Text>
          </Box>

          <Box padding="lg" backgroundColor="white" borderRadius="lg">
            <QRCode size={200} value={activeAccount.address} />
          </Box>

          <Box flexDirection="row" alignItems="center">
            <Text marginRight="sm" marginVertical="md">
              {shortenAddress(activeAccount.address)}
            </Text>
            <QRCodeIcon height={15} width={15} stroke="gray" />
          </Box>

          <Box flexDirection="row" justifyContent="space-between">
            <PrimaryCopyTextButton
              label={t`Copy`}
              flex={1}
              variant="gray"
              style={copyButtonStyle}
              copyText={activeAccount.address}
              textColor="black"
              icon={<CopySheets width={18} height={18} stroke="black" />}
            />
            <PrimaryButton
              marginLeft="sm"
              flex={1}
              label={t`Share`}
              icon={<ShareIcon width={18} height={18} stroke="white" />}
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

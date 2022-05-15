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
import { opacify } from 'src/utils/colors'
import { logger } from 'src/utils/logger'

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props) {
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
    <Box alignItems="center" p="lg">
      <Box backgroundColor="white" borderRadius="lg" mb="lg" padding="lg">
        <QRCode size={200} value={address} />
        <Flex
          backgroundColor="white"
          borderRadius="full"
          left={88}
          padding="sm"
          position={'absolute'}
          top={88}>
          <Identicon address={address} size={54} />
        </Flex>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" width={'80%'}>
        <PrimaryCopyTextButton
          copyText={address}
          flex={1}
          icon={<CopySheets color={theme.colors.deprecated_textColor} height={18} width={18} />}
          label={t`Copy`}
          style={{ backgroundColor: opacify(30, theme.colors.deprecated_gray100) }}
        />
        <PrimaryButton
          flex={1}
          icon={<ShareIcon color="white" height={18} width={18} />}
          label={t`Share`}
          marginLeft="sm"
          style={{ backgroundColor: opacify(30, theme.colors.deprecated_gray100) }}
          onPress={onShare}
        />
      </Box>
    </Box>
  )
}

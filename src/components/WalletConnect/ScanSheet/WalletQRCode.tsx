import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'
import { logger } from 'src/utils/logger'

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const ens = useENS(ChainId.Mainnet, address)

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
    <AnimatedFlex centered grow entering={FadeIn} exiting={FadeOut} gap="xl" p="lg">
      <Flex centered gap="xs">
        <Text color="textPrimary" variant="largeLabel">
          {ens.name ?? shortenAddress(address)}
        </Text>
        <Text color="textSecondary" variant="subHead1">
          {ens.name ? shortenAddress(address) : ''}
        </Text>
      </Flex>
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
          icon={<CopySheets color={theme.colors.textPrimary} height={18} width={18} />}
          label={t`Copy`}
          style={{ backgroundColor: opacify(30, theme.colors.deprecated_gray100) }}
          textColor="textPrimary"
        />
        <PrimaryButton
          flex={1}
          icon={<ShareIcon color={theme.colors.textPrimary} height={18} width={18} />}
          label={t`Share`}
          marginLeft="sm"
          style={{ backgroundColor: opacify(30, theme.colors.deprecated_gray100) }}
          textColor="textPrimary"
          onPress={onShare}
        />
      </Box>
    </AnimatedFlex>
  )
}

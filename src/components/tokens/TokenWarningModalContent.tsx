import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import EtherscanIcon from 'src/assets/icons/etherscan-icon.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import {
  TokenWarningLevel,
  useTokenWarningLevel,
  useTokenWarningLevelColors,
} from 'src/features/tokens/useTokenWarningLevel'
import { opacify } from 'src/utils/colors'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'

interface Props {
  currency: Currency
  onClose: () => void
  onAccept: () => void
}

function getWarningText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return t(
        'This token is not on any partner list and has >$Y volume in the last 7 days. Trading it may result in tktk. Please check the Etherscan link below to verify this is the right token.'
      )
    case TokenWarningLevel.MEDIUM:
      return t(
        'This token does not appear on any partner token lists or has very low trade volume.  Please check the Etherscan link below to verify this is the right token.'
      )
    default:
      return ''
  }
}

/**
 * Warning speedbump for selecting certain tokens.
 * @TODO : when nav refactor is complete, can always wrap this in a bottom modal
 */
export default function TokenWarningModalContent({ currency, onClose, onAccept }: Props) {
  const { t } = useTranslation()

  const theme = useAppTheme()
  const { tokenWarningLevel } = useTokenWarningLevel(currency)
  const warningColor = useTokenWarningLevelColors(tokenWarningLevel)

  const explorerLink = getExplorerLink(
    currency.chainId,
    currency.wrapped.address,
    ExplorerDataType.ADDRESS
  )

  return (
    <Flex centered gap="lg" mb="xxl" p="lg">
      <Flex
        centered
        borderRadius="md"
        borderWidth={1}
        p="sm"
        style={{
          backgroundColor: opacify(10, theme.colors[warningColor]),
          borderColor: opacify(60, theme.colors[warningColor]),
        }}>
        <AlertTriangle color={theme.colors[warningColor]} />
      </Flex>
      <Text variant="mediumLabel">{t('Are you sure?')}</Text>
      <Text color="deprecated_gray400" lineHeight={20} textAlign="center" variant="mediumLabel">
        {getWarningText(tokenWarningLevel, t)}
      </Text>
      <Button onPress={() => openUri(explorerLink)}>
        <Flex
          centered
          row
          borderRadius="md"
          gap="xs"
          p="sm"
          style={{ backgroundColor: opacify(20, theme.colors.deprecated_blue) }}>
          <EtherscanIcon />
          <Text
            color="deprecated_blue"
            ellipsizeMode="tail"
            fontWeight="bold"
            mr="sm"
            numberOfLines={1}>
            {explorerLink}
          </Text>
        </Flex>
      </Button>
      <Flex centered row>
        <PrimaryButton flex={1} label={t('Cancel')} variant="gray" onPress={onClose} />
        <Button
          alignItems="center"
          borderRadius="lg"
          flex={1}
          flexDirection="row"
          justifyContent="center"
          px="md"
          py="sm"
          style={{ backgroundColor: opacify(20, theme.colors[warningColor]) }}
          testID={ElementName.TokenWarningAccept}
          onPress={onAccept}>
          <Text color={warningColor} textAlign="center" variant="mediumLabel">
            {t('I understand')}
          </Text>
        </Button>
      </Flex>
    </Flex>
  )
}

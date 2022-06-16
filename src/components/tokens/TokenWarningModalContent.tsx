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
import { getTokenWarningHeaderText } from 'src/components/tokens/utils'
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
    case TokenWarningLevel.MEDIUM:
      return t('Please do your own research before trading.')
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
    <Flex centered gap="xs" mb="xxl" p="lg">
      <Flex
        centered
        row
        borderRadius="xs"
        gap="xxs"
        p="xxs"
        style={{
          backgroundColor: opacify(10, theme.colors[warningColor]),
          borderColor: opacify(60, theme.colors[warningColor]),
        }}>
        <Text color={warningColor} fontWeight="700" variant="caption">
          {getTokenWarningHeaderText(tokenWarningLevel, t)}
        </Text>
        <AlertTriangle color={theme.colors[warningColor]} height={14} />
      </Flex>
      <Text variant="largeLabel">{t('This token isn’t verified')}</Text>
      <Text color="neutralTextPrimary" fontWeight="400" textAlign="center" variant="smallLabel">
        {getWarningText(tokenWarningLevel, t)} <Text fontWeight="700">{t('Learn more')}</Text>
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
      <Flex centered row mt="md">
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

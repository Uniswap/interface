import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import EtherscanLogo from 'src/assets/logos/etherscan-logo.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { getTokenWarningHeaderText } from 'src/components/tokens/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  TokenWarningLevel,
  useTokenWarningLevelColors,
} from 'src/features/tokens/useTokenWarningLevel'
import { opacify } from 'src/utils/colors'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'

interface Props {
  isVisible: boolean
  currency: Currency
  tokenWarningLevel: TokenWarningLevel
  onClose: () => void
  onAccept: () => void
}

function getWarningText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return t('Please do your own research before trading.')
    case TokenWarningLevel.MEDIUM:
      return t('Please do your own research before trading.')
    case TokenWarningLevel.BLOCKED:
      return t("You can't trade this token using Uniswap wallet")
    default:
      return ''
  }
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currency,
  tokenWarningLevel,
  onClose,
  onAccept,
}: Props) {
  const { t } = useTranslation()

  const theme = useAppTheme()
  const warningColor = useTokenWarningLevelColors(tokenWarningLevel)

  const explorerLink = getExplorerLink(
    currency.chainId,
    currency.wrapped.address,
    ExplorerDataType.ADDRESS
  )

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.TokenWarningModal} onClose={onClose}>
      <Flex centered gap="sm" mb="md" p="lg">
        <Flex centered>
          <CurrencyLogo currency={currency} size={48} />
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
            <AlertTriangle color={theme.colors[warningColor]} height={14} />
            <Text color={warningColor} variant="buttonLabelMicro">
              {getTokenWarningHeaderText(tokenWarningLevel, t)}
            </Text>
          </Flex>
        </Flex>
        <Text variant="subheadLarge">
          {tokenWarningLevel === TokenWarningLevel.BLOCKED
            ? t('Not available')
            : t('This token isn’t verified')}
        </Text>
        <Flex centered gap="xxs">
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {getWarningText(tokenWarningLevel, t)}
          </Text>
          <Text color="accentActive">{t('Learn more')}</Text>
        </Flex>
        <Button
          alignItems="center"
          bg="accentActiveSoft"
          borderRadius="sm"
          flexDirection="row"
          mx="xxl"
          p="xs"
          onPress={() => openUri(explorerLink)}>
          <EtherscanLogo height={16} width={16} />
          <Text
            color="accentActive"
            ellipsizeMode="tail"
            mx="xs"
            numberOfLines={1}
            variant="buttonLabelMicro">
            {explorerLink}
          </Text>
          <ExternalLinkIcon fill={theme.colors.accentTextLightSecondary} height={12} width={12} />
        </Button>
        {tokenWarningLevel === TokenWarningLevel.BLOCKED ? (
          <Flex row>
            <PrimaryButton
              flexGrow={1}
              label={t('Close')}
              mt="md"
              testID={ElementName.Cancel}
              variant="transparent"
              onPress={onClose}
            />
          </Flex>
        ) : (
          <Flex centered row mt="md">
            <PrimaryButton
              flex={1}
              label={t('Cancel')}
              testID={ElementName.Cancel}
              variant="transparent"
              onPress={onClose}
            />
            <PrimaryButton
              flex={1}
              label={t('I understand')}
              testID={ElementName.TokenWarningAccept}
              variant={tokenWarningLevel === TokenWarningLevel.LOW ? 'blue' : 'failure'}
              onPress={onAccept}
            />
          </Flex>
        )}
      </Flex>
    </BottomSheetModal>
  )
}

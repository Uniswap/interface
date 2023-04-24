import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { getTokenSafetyHeaderText } from 'src/components/tokens/utils'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { TOKEN_WARNING_HELP_PAGE_URL } from 'src/constants/urls'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useTokenSafetyLevelColors } from 'src/features/tokens/safetyHooks'
import { iconSizes } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'

function getTokenSafetyBodyText(safetyLevel: NullUndefined<SafetyLevel>, t: TFunction): string {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return t(
        "This token isn't traded on leading U.S. centralized exchanges. Always conduct your own research before trading."
      )
    case SafetyLevel.StrongWarning:
      return t(
        "This token isn't traded on leading U.S. centralized exchanges or frequently swapped on Uniswap. Always conduct your own research before trading."
      )
    case SafetyLevel.Blocked:
      return t("You can't trade this token using the Uniswap Wallet.")
    default:
      return ''
  }
}

interface Props {
  isVisible: boolean
  currencyId: string
  safetyLevel: NullUndefined<SafetyLevel>
  disableAccept?: boolean // only show message and close button
  tokenLogoUrl: NullUndefined<string>
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currencyId,
  safetyLevel,
  disableAccept,
  tokenLogoUrl,
  onClose,
  onAccept,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const warningColor = useTokenSafetyLevelColors(safetyLevel)

  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToAddress(currencyId)

  const explorerLink = getExplorerLink(chainId, address, ExplorerDataType.ADDRESS)

  // always hide accept button if blocked token
  const hideAcceptButton = disableAccept || safetyLevel === SafetyLevel.Blocked

  const closeButtonText = hideAcceptButton ? t('Close') : t('Back')

  const onPressLearnMore = (): void => {
    openUri(TOKEN_WARNING_HELP_PAGE_URL)
  }

  const showWarningIcon =
    safetyLevel === SafetyLevel.StrongWarning || safetyLevel === SafetyLevel.Blocked

  if (!isVisible) return null

  return (
    <BottomSheetModal name={ModalName.TokenWarningModal} onClose={onClose}>
      <Flex centered gap="spacing16" mb="spacing16" p="spacing12">
        {showWarningIcon ? (
          <Flex centered gap="spacing16">
            <Flex
              centered
              borderRadius="rounded12"
              p="spacing12"
              style={{
                backgroundColor: opacify(12, theme.colors[warningColor]),
              }}>
              <WarningIcon safetyLevel={safetyLevel} width={theme.iconSizes.icon24} />
            </Flex>
            <Text variant="buttonLabelMedium">{getTokenSafetyHeaderText(safetyLevel, t)}</Text>
          </Flex>
        ) : (
          <TokenLogo size={theme.imageSizes.image48} url={tokenLogoUrl} />
        )}
        <Flex centered gap="spacing4" width="90%">
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {getTokenSafetyBodyText(safetyLevel, t)}{' '}
            <TouchableArea height={18} onPress={onPressLearnMore}>
              <Text color="accentActive" variant="buttonLabelSmall">
                {t('Learn more')}
              </Text>
            </TouchableArea>
          </Text>
        </Flex>
        <TouchableArea
          alignItems="center"
          bg="accentActiveSoft"
          borderRadius="rounded16"
          flexDirection="row"
          mx="spacing48"
          px="spacing12"
          py="spacing8"
          onPress={(): Promise<void> => openUri(explorerLink)}>
          <Text
            color="accentActive"
            ellipsizeMode="tail"
            mx="spacing8"
            numberOfLines={1}
            variant="buttonLabelMicro">
            {explorerLink}
          </Text>
          <ExternalLinkIcon
            color={theme.colors.accentActive}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
        </TouchableArea>
        <Flex centered row mt="spacing16">
          <Button
            fill
            emphasis={ButtonEmphasis.Tertiary}
            label={closeButtonText}
            name={ElementName.Cancel}
            onPress={onClose}
          />
          {!hideAcceptButton && (
            <Button
              fill
              emphasis={getButtonEmphasis(safetyLevel)}
              label={showWarningIcon ? t('I understand') : t('Continue')}
              name={ElementName.TokenWarningAccept}
              onPress={onAccept}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function getButtonEmphasis(safetyLevel: NullUndefined<SafetyLevel>): ButtonEmphasis | undefined {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return ButtonEmphasis.Secondary
    case SafetyLevel.StrongWarning:
      return ButtonEmphasis.Detrimental
    default:
      return undefined
  }
}

import { FOTTooltipContent } from 'components/swap/SwapLineItem'
import { NoInfoAvailable, truncateDescription } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback, useReducer } from 'react'
import { Copy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Paragraph, styled, Text, TouchableArea, useSporeColors } from 'ui/src'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

const TokenInfoButton = styled(Text, {
  variant: 'buttonLabel3',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap4',
  py: '$padding8',
  px: '$padding12',
  borderRadius: '$rounded20',
  backgroundColor: '$surface2',
  width: 'max-content',
  ...ClickableTamaguiStyle,
  color: '$neutral1',
})

const TokenDescriptionContainer = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  maxWidth: '100%',
  maxHeight: 'fit-content',
  ...EllipsisTamaguiStyle,
  whiteSpace: 'pre-wrap',
  lineHeight: 24,
})

const DescriptionVisibilityWrapper = styled(Paragraph, {
  fontWeight: '$book',
  variants: {
    visible: {
      true: {
        display: 'inline',
      },
      false: {
        display: 'none',
      },
    },
  } as const,
})

const TRUNCATE_CHARACTER_COUNT = 300

function TokenLinkButton({ uri, icon, name }: { uri: string; icon: JSX.Element; name: string }) {
  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$gap4"
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      px="$padding12"
      py="$padding8"
      width="max-content"
      onPress={() => openUri({ uri })}
    >
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {name}
      </Text>
    </TouchableArea>
  )
}

export function TokenDescription() {
  const { t } = useTranslation()
  const { address, currency, tokenQuery } = useTDPContext()
  const colors = useSporeColors()

  const { description, homepageUrl, twitterName } = tokenQuery.data?.token?.project ?? {}
  const explorerUrl = getExplorerLink({
    chainId: currency.chainId,
    data: address,
    type: currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  })

  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated
  const { inputTax: sellFee, outputTax: buyFee } = useSwapTaxes({
    inputTokenAddress: address,
    outputTokenAddress: address,
    tokenChainId: currency.chainId,
  })
  const { formatPercent } = useLocalizationContext()
  const { sellFeeString, buyFeeString } = {
    sellFeeString: formatPercent(sellFee.toSignificant()),
    buyFeeString: formatPercent(buyFee.toSignificant()),
  }
  const hasFee = Boolean(parseFloat(sellFeeString)) || Boolean(parseFloat(buyFee.toFixed(2)))
  const sameFee = sellFeeString === buyFeeString

  const Icon = getBlockExplorerIcon(currency.chainId)
  const explorerName = getChainInfo(currency.chainId).explorer.name

  return (
    <Flex data-testid="token-details-info-section" gap="$gap16" width="100%" $xl={{ gap: '$gap24' }}>
      <Text variant="heading3">{t('common.info.label')}</Text>
      <Flex row flexWrap="wrap" gap="$gap8" width="100%" data-testid="token-details-info-links">
        {!currency.isNative && (
          <MouseoverTooltip
            disabled
            placement="bottom"
            size={TooltipSize.Max}
            forceShow={isCopied}
            text={t('common.copied')}
          >
            <TokenInfoButton onPress={copy}>
              <Copy width="18px" height="18px" color={colors.neutral1.val} />
              {shortenAddress({ address: currency.address })}
            </TokenInfoButton>
          </MouseoverTooltip>
        )}
        <TokenLinkButton uri={explorerUrl} icon={<Icon size="$icon.18" color="$neutral1" />} name={explorerName} />
        {homepageUrl && (
          <TokenLinkButton
            uri={homepageUrl}
            icon={<GlobeFilled size="$icon.18" color="$neutral1" />}
            name={t('common.website')}
          />
        )}
        {twitterName && (
          <TokenLinkButton
            uri={`https://x.com/${twitterName}`}
            icon={<XTwitter size="$icon.18" color="$neutral1" />}
            name={t('common.twitter')}
          />
        )}
      </Flex>
      <TokenDescriptionContainer>
        {!description && <NoInfoAvailable>{t('tdp.noInfoAvailable')}</NoInfoAvailable>}
        {description && (
          <>
            <DescriptionVisibilityWrapper data-testid="token-description-full" visible={!showTruncatedDescription}>
              {description}
            </DescriptionVisibilityWrapper>
            <DescriptionVisibilityWrapper data-testid="token-description-truncated" visible={showTruncatedDescription}>
              {truncatedDescription}
            </DescriptionVisibilityWrapper>
          </>
        )}
        {shouldTruncate && (
          <Text
            display="flex"
            color="neutral2"
            fontWeight="485"
            variant="body2"
            pt="0.5em"
            $sm={{ mb: '2rem' }}
            onPress={toggleIsDescriptionTruncated}
            {...ClickableTamaguiStyle}
            data-testid="token-description-show-more-button"
          >
            {isDescriptionTruncated ? t('common.showMore.button') : t('common.hide.button')}
          </Text>
        )}
      </TokenDescriptionContainer>
      {hasFee && (
        <MouseoverTooltip
          placement="left"
          size={TooltipSize.Small}
          text={
            <ThemedText.Caption color="neutral2">
              <FOTTooltipContent />
            </ThemedText.Caption>
          }
        >
          <Flex gap="$gap8">
            {sameFee ? (
              <ThemedText.BodyPrimary>
                {currency.symbol}&nbsp;
                {t('token.fee.label')}
                :&nbsp;{sellFeeString}
              </ThemedText.BodyPrimary>
            ) : (
              <>
                <ThemedText.BodyPrimary>
                  {currency.symbol}&nbsp;
                  {t('token.fee.buy.label')}
                  :&nbsp;{buyFeeString}
                </ThemedText.BodyPrimary>{' '}
                <ThemedText.BodyPrimary>
                  {currency.symbol}&nbsp;
                  {t('token.fee.sell.label')}
                  :&nbsp;{sellFeeString}
                </ThemedText.BodyPrimary>{' '}
              </>
            )}
          </Flex>
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, styled, Text, TouchableArea } from 'ui/src'
import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { Page } from 'ui/src/components/icons/Page'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { iconSizes } from 'ui/src/theme'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, isAllowedExternalUri, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { FOTTooltipContent } from '~/features/Swap/SwapLineItemTooltips'
import { useSwapTaxes } from '~/hooks/useSwapTaxes'
import {
  MultichainPillDropdown,
  TokenInfoButton,
  tokenPillStyles,
  useMultichainPopoverContentProps,
} from '~/pages/TokenDetails/components/info/MultichainPillDropdown'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTokenAddressCopy } from '~/pages/TokenDetails/hooks/useTokenAddressCopy'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const TRUNCATE_CHARACTER_COUNT = 300

const truncateDescription = (desc: string, maxCharacterCount = TRUNCATE_CHARACTER_COUNT) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, maxCharacterCount)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' ')),
  )}...`
  return tokenDescriptionTruncated
}

const TokenDescriptionContainer = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  maxWidth: '100%',
  maxHeight: 'fit-content',
  ...EllipsisTamaguiStyle,
  whiteSpace: 'pre-wrap',
  lineHeight: 24,
})

function TokenLinkButton({
  uri,
  icon,
  name,
  onPress,
}: {
  uri: string
  icon: JSX.Element
  name: string
  /** Fires on click before the browser follows the link (e.g. analytics). */
  onPress?: () => void
}) {
  if (!isAllowedExternalUri(uri)) {
    logger.warn('TokenLinkButton', 'render', 'Blocked unsafe external URL', { uri, name })
    return null
  }
  return (
    <TouchableArea
      tag="a"
      role="link"
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      {...tokenPillStyles}
      $platform-web={{ textDecorationLine: 'none' }}
      onPress={onPress}
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
  const trace = useTrace()
  const { tokenProjectQuery, multiChainMap, selectedMultichainChainId } = useTDPStore((s) => ({
    tokenProjectQuery: s.tokenProjectQuery,
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const hasMultipleChains = multichainEntries.length > 1

  const effectiveCurrency = useTDPEffectiveCurrency()

  const displayAddress = effectiveCurrency.isNative ? NATIVE_CHAIN_ID : effectiveCurrency.address

  // Read About metadata from the lightweight project query so this section paints with the header,
  // instead of waiting on the heavy market `tokenQuery`.
  const { description, homepageUrl, twitterName } = useTokenMetadata(currencyId(effectiveCurrency), {
    legacyToken: tokenProjectQuery.data?.token,
  })
  const explorerUrl = getExplorerLink({
    chainId: effectiveCurrency.chainId,
    data: displayAddress,
    type: effectiveCurrency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  })

  const { isCopied, copy, onCopyMultichainAddress } = useTokenAddressCopy({
    displayAddress,
    chainId: effectiveCurrency.chainId,
  })

  const [isExplorerOpen, setIsExplorerOpen] = useState(false)
  const [isAddressOpen, setIsAddressOpen] = useState(false)
  const multichainPopoverContentProps = useMultichainPopoverContentProps()

  const logTdpExplorerLinkClicked = useCallback(
    (chainId: UniverseChainId) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.TokenExplorerLink,
        chain_name: getChainInfo(chainId).urlParam,
      })
    },
    [trace],
  )

  const handleExplorerPress = useCallback(
    (url: string, chainId: UniverseChainId) => {
      logTdpExplorerLinkClicked(chainId)
      openUri({ uri: url }).catch(() => {})
    },
    [logTdpExplorerLinkClicked],
  )

  const handleSingleChainExplorerPress = useCallback(() => {
    logTdpExplorerLinkClicked(effectiveCurrency.chainId)
  }, [effectiveCurrency.chainId, logTdpExplorerLinkClicked])

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated
  const { inputTax: sellFee, outputTax: buyFee } = useSwapTaxes({
    inputTokenAddress: displayAddress,
    outputTokenAddress: displayAddress,
    tokenChainId: effectiveCurrency.chainId,
  })
  const { formatPercent } = useLocalizationContext()
  const { sellFeeString, buyFeeString } = {
    sellFeeString: formatPercent(sellFee.toSignificant()),
    buyFeeString: formatPercent(buyFee.toSignificant()),
  }
  const hasFee = Boolean(parseFloat(sellFeeString)) || Boolean(parseFloat(buyFee.toFixed(2)))
  const sameFee = sellFeeString === buyFeeString

  const Icon = getBlockExplorerIcon(effectiveCurrency.chainId)
  const explorerName = getChainInfo(effectiveCurrency.chainId).explorer.name

  const showMultichainDropdowns = hasMultipleChains && !selectedMultichainChainId

  const addressPill = effectiveCurrency.isNative ? null : showMultichainDropdowns ? (
    <MultichainPillDropdown
      testID={TestID.MultichainAddressDropdown}
      icon={<Page size="$icon.16" color="$neutral1" />}
      name={t('common.address')}
      isOpen={isAddressOpen}
      onOpenChange={setIsAddressOpen}
      popoverContentProps={multichainPopoverContentProps}
      modalName={ModalName.MultichainAddressModal}
    >
      <MultichainAddressList chains={multichainEntries} onCopyAddress={onCopyMultichainAddress} />
    </MultichainPillDropdown>
  ) : (
    <TokenInfoButton
      onPress={copy}
      icon={
        selectedMultichainChainId ? (
          <NetworkLogo chainId={selectedMultichainChainId} size={iconSizes.icon16} />
        ) : (
          <Page size="$icon.16" color="$neutral1" />
        )
      }
      iconRight={
        selectedMultichainChainId ? (
          <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral1" />
        ) : undefined
      }
      name={shortenAddress({ address: displayAddress })}
    />
  )

  const explorerPill = showMultichainDropdowns ? (
    <MultichainPillDropdown
      testID={TestID.MultichainExplorerDropdown}
      icon={<BlockExplorer size="$icon.16" color="$neutral1" />}
      name={t('common.explorer')}
      isOpen={isExplorerOpen}
      onOpenChange={setIsExplorerOpen}
      popoverContentProps={multichainPopoverContentProps}
      modalName={ModalName.MultichainExplorerModal}
    >
      <MultichainExplorerList
        chains={multichainEntries}
        isNativeToken={effectiveCurrency.isNative}
        onExplorerPress={handleExplorerPress}
      />
    </MultichainPillDropdown>
  ) : (
    <TokenLinkButton
      uri={explorerUrl}
      icon={
        selectedMultichainChainId ? (
          <BlockExplorer size="$icon.16" color="$neutral1" />
        ) : (
          <Icon size="$icon.16" color="$neutral1" />
        )
      }
      name={explorerName}
      onPress={handleSingleChainExplorerPress}
    />
  )

  const websitePill = homepageUrl ? (
    <TokenLinkButton
      uri={homepageUrl}
      icon={<GlobeFilled size="$icon.16" color="$neutral1" />}
      name={t('common.website')}
    />
  ) : null

  const twitterPill = twitterName ? (
    <TokenLinkButton
      uri={`https://x.com/${twitterName}`}
      icon={<XTwitter size="$icon.16" color="$neutral1" />}
      name={t('common.twitter')}
    />
  ) : null

  return (
    <Flex data-testid={TestID.TokenDetailsAboutSection} gap="$gap20" width="100%" $md={{ gap: '$gap16' }}>
      <Text variant="heading3">{t('common.about')}</Text>
      <TokenDescriptionContainer>
        {!description && (
          <Text variant="body2" color="$neutral3">
            {t('tdp.noInfoAvailable')}
          </Text>
        )}
        {description && (
          <Text tag="h2" variant="body2" color="$neutral2" whiteSpace="normal">
            {!showTruncatedDescription ? (
              <span data-testid={TestID.TokenDetailsDescriptionFull}>{description}</span>
            ) : (
              <span data-testid={TestID.TokenDetailsDescriptionTruncated}>{truncatedDescription}</span>
            )}
          </Text>
        )}
        {shouldTruncate && (
          <TouchableArea
            onPress={toggleIsDescriptionTruncated}
            data-testid="token-description-show-more-button"
            display="inline"
          >
            <Text display="inline" variant="buttonLabel2" ml="$spacing8" textWrap="nowrap">
              {isDescriptionTruncated ? t('common.showMore.button') : t('common.hide.button')}
            </Text>
          </TouchableArea>
        )}
      </TokenDescriptionContainer>
      <Flex row flexWrap="wrap" gap="$gap12" width="100%" data-testid={TestID.TokenDetailsAboutLinks}>
        {addressPill}
        {explorerPill}
        {websitePill}
        {twitterPill}
      </Flex>
      {hasFee && (
        <MouseoverTooltip
          placement="left"
          size={TooltipSize.Small}
          text={
            <Text variant="body4" color="$neutral2" lineHeight={16}>
              <FOTTooltipContent />
            </Text>
          }
        >
          <Flex gap="$gap8">
            {sameFee ? (
              <Text variant="body2" color="$neutral1">
                {effectiveCurrency.symbol}&nbsp;
                {t('token.fee.label')}
                :&nbsp;{sellFeeString}
              </Text>
            ) : (
              <>
                <Text variant="body2" color="$neutral1">
                  {effectiveCurrency.symbol}&nbsp;
                  {t('token.fee.buy.label')}
                  :&nbsp;{buyFeeString}
                </Text>{' '}
                <Text variant="body2" color="$neutral1">
                  {effectiveCurrency.symbol}&nbsp;
                  {t('token.fee.sell.label')}
                  :&nbsp;{sellFeeString}
                </Text>{' '}
              </>
            )}
          </Flex>
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, Popover, styled, Text, TouchableArea, useMedia } from 'ui/src'
import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { AdaptiveWebPopoverContent } from 'ui/src/components/popover/AdaptiveWebPopoverContent'
import { iconSizes } from 'ui/src/theme'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { FOTTooltipContent } from '~/components/swap/SwapLineItem'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import useCopyClipboard from '~/hooks/useCopyClipboard'
import { useSwapTaxes } from '~/hooks/useSwapTaxes'
import { MultiChainMap, useTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const TRUNCATE_CHARACTER_COUNT = 300
const MULTICHAIN_POPOVER_WIDTH = 280
const MULTICHAIN_POPOVER_HEIGHT = 256
const MULTICHAIN_SNAP_POINTS = ['65%', '100%']

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

const tokenPillStyles = {
  row: true,
  alignItems: 'center' as const,
  gap: '$gap8' as const,
  backgroundColor: '$surface1' as const,
  borderRadius: '$rounded12' as const,
  borderWidth: 1,
  borderColor: '$surface3' as const,
  px: '$padding12' as const,
  py: '$padding8' as const,
  width: 'max-content',
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

function TokenInfoButton({
  icon,
  name,
  onPress,
  testID,
}: {
  icon: JSX.Element
  name: string
  onPress?: () => void
  testID?: string
}) {
  return (
    <TouchableArea {...tokenPillStyles} testID={testID} onPress={onPress}>
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {name}
      </Text>
    </TouchableArea>
  )
}

function TokenLinkButton({ uri, icon, name }: { uri: string; icon: JSX.Element; name: string }) {
  return (
    <TouchableArea
      tag="a"
      role="link"
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      {...tokenPillStyles}
      $platform-web={{ textDecorationLine: 'none' }}
    >
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {name}
      </Text>
    </TouchableArea>
  )
}

/** Converts TDPContext's multiChainMap into a list of MultichainTokenEntry items ordered by network selector order. */
function useMultichainTokenEntries(multiChainMap: MultiChainMap): MultichainTokenEntry[] {
  const entries = useMemo(() => {
    const result: MultichainTokenEntry[] = []
    for (const [graphqlChain, data] of Object.entries(multiChainMap)) {
      const chainId = fromGraphQLChain(graphqlChain)
      if (chainId && data.address) {
        result.push({ chainId, address: data.address })
      }
    }
    return result
  }, [multiChainMap])

  return useOrderedMultichainEntries(entries)
}

export function TokenDescription() {
  const { t } = useTranslation()
  const { address, currency, tokenQuery, multiChainMap } = useTDPContext()

  const isMultichainTokenUx = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const hasMultipleChains = multichainEntries.length > 1

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

  const media = useMedia()
  const shadowProps = useShadowPropsMedium()
  const [isExplorerOpen, setIsExplorerOpen] = useState(false)
  const [isAddressOpen, setIsAddressOpen] = useState(false)

  const multichainPopoverTriggerProps = {
    hoverable: true,
    placement: 'top-start' as const,
    offset: 8,
    stayInFrame: true,
    allowFlip: true,
  }

  const multichainPopoverContentProps = {
    isSheet: false,
    placement: 'top-start' as const,
    borderRadius: '$rounded20' as const,
    borderWidth: 1,
    borderColor: '$surface3' as const,
    backgroundColor: '$surface1' as const,
    alignItems: 'stretch' as const,
    px: '$spacing8' as const,
    py: '$none' as const,
    width: MULTICHAIN_POPOVER_WIDTH,
    maxHeight: MULTICHAIN_POPOVER_HEIGHT,
    webBottomSheetProps: { px: '$spacing24' },
    ...shadowProps,
  }

  const handleExplorerPress = useCallback((url: string) => {
    openUri({ uri: url })
  }, [])

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
      <Flex row flexWrap="wrap" gap="$gap8" width="100%" data-testid={TestID.TokenDetailsAboutLinks}>
        {homepageUrl && (
          <TokenLinkButton
            uri={homepageUrl}
            icon={<GlobeFilled size="$icon.16" color="$neutral1" />}
            name={t('common.website')}
          />
        )}
        {twitterName && (
          <TokenLinkButton
            uri={`https://x.com/${twitterName}`}
            icon={<XTwitter size="$icon.16" color="$neutral1" />}
            name={t('common.twitter')}
          />
        )}

        {/* Explorer link pill or multichain explorer dropdown */}
        {isMultichainTokenUx && hasMultipleChains ? (
          <>
            {media.md ? (
              <>
                <TokenInfoButton
                  testID={TestID.MultichainExplorerDropdown}
                  onPress={() => setIsExplorerOpen(true)}
                  icon={<BlockExplorer size="$icon.16" color="$neutral1" />}
                  name={t('common.explorer')}
                />
                {isExplorerOpen && (
                  <Modal
                    fullScreen
                    name={ModalName.MultichainExplorerModal}
                    snapPoints={MULTICHAIN_SNAP_POINTS}
                    padding="$none"
                    onClose={() => setIsExplorerOpen(false)}
                  >
                    <Flex grow maxHeight="100%" overflow="hidden" px="$spacing24">
                      <MultichainExplorerList
                        chains={multichainEntries}
                        isNativeToken={currency.isNative}
                        onExplorerPress={handleExplorerPress}
                      />
                    </Flex>
                  </Modal>
                )}
              </>
            ) : (
              <Popover {...multichainPopoverTriggerProps} onOpenChange={setIsExplorerOpen}>
                <Popover.Trigger>
                  <TokenInfoButton
                    testID={TestID.MultichainExplorerDropdown}
                    icon={<BlockExplorer size="$icon.16" color="$neutral1" />}
                    name={t('common.explorer')}
                  />
                </Popover.Trigger>
                <AdaptiveWebPopoverContent isOpen={isExplorerOpen} {...multichainPopoverContentProps}>
                  <MultichainExplorerList
                    chains={multichainEntries}
                    isNativeToken={currency.isNative}
                    onExplorerPress={handleExplorerPress}
                  />
                </AdaptiveWebPopoverContent>
              </Popover>
            )}
          </>
        ) : (
          <TokenLinkButton uri={explorerUrl} icon={<Icon size="$icon.16" color="$neutral1" />} name={explorerName} />
        )}

        {/* Copy address pill or multichain address dropdown */}
        {!currency.isNative && isMultichainTokenUx && hasMultipleChains ? (
          <>
            {media.md ? (
              <>
                <TokenInfoButton
                  testID={TestID.MultichainAddressDropdown}
                  onPress={() => setIsAddressOpen(true)}
                  icon={<CopySheets size="$icon.16" color="$neutral1" />}
                  name={t('common.address')}
                />
                {isAddressOpen && (
                  <Modal
                    fullScreen
                    name={ModalName.MultichainAddressModal}
                    snapPoints={MULTICHAIN_SNAP_POINTS}
                    padding="$none"
                    onClose={() => setIsAddressOpen(false)}
                  >
                    <Flex grow maxHeight="100%" overflow="hidden" px="$spacing24">
                      <MultichainAddressList chains={multichainEntries} onCopyAddress={setCopied} />
                    </Flex>
                  </Modal>
                )}
              </>
            ) : (
              <Popover {...multichainPopoverTriggerProps} onOpenChange={setIsAddressOpen}>
                <Popover.Trigger>
                  <TokenInfoButton
                    testID={TestID.MultichainAddressDropdown}
                    icon={<CopySheets size="$icon.16" color="$neutral1" />}
                    name={t('common.address')}
                  />
                </Popover.Trigger>
                <AdaptiveWebPopoverContent isOpen={isAddressOpen} {...multichainPopoverContentProps}>
                  <MultichainAddressList chains={multichainEntries} onCopyAddress={setCopied} />
                </AdaptiveWebPopoverContent>
              </Popover>
            )}
          </>
        ) : (
          !currency.isNative && (
            <TokenInfoButton
              onPress={copy}
              icon={<AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral1" />}
              name={shortenAddress({ address: currency.address })}
            />
          )
        )}
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
                {currency.symbol}&nbsp;
                {t('token.fee.label')}
                :&nbsp;{sellFeeString}
              </Text>
            ) : (
              <>
                <Text variant="body2" color="$neutral1">
                  {currency.symbol}&nbsp;
                  {t('token.fee.buy.label')}
                  :&nbsp;{buyFeeString}
                </Text>{' '}
                <Text variant="body2" color="$neutral1">
                  {currency.symbol}&nbsp;
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

import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { Globe } from 'components/Icons/Globe'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import ShareButton, { openShareTweetWindow } from 'components/Tokens/TokenDetails/ShareButton'
import { TokenNameCell } from 'components/Tokens/TokenDetails/Skeleton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useMemo, useState } from 'react'
import { Link, MoreHorizontal } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { EllipsisTamaguiStyle } from 'theme/components'
import { Flex, Text, WebBottomSheet, useMedia, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { iconSizes } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isMobileWeb } from 'utilities/src/platform'

export const TokenDetailsHeader = () => {
  const { address, currency, tokenQuery } = useTDPContext()

  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const isMobileScreen = media.sm

  const [mobileSheetOpen, toggleMobileSheet] = useState(false)

  const tokenSymbolName = currency.symbol ?? t('tdp.symbolNotFound')

  const explorerUrl = getExplorerLink(
    currency.chainId,
    address,
    currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  )

  const { homepageUrl, twitterName } = tokenQuery.data?.token?.project ?? {}
  const twitterUrl = twitterName && `https://x.com/${twitterName}`

  const [searchParams] = useSearchParams()
  const utmTag = `${searchParams.size > 0 ? '&' : '?'}utm_source=share-tdp&utm_medium=${isMobileWeb ? 'mobile' : 'web'}`
  const currentLocation = window.location.href + utmTag

  const twitterShareName =
    currency.name && currency.symbol
      ? `${currency.name} (${currency.symbol})`
      : currency?.name || currency?.symbol || ''

  const [isCopied, setCopied] = useCopyClipboard()

  const HeaderActions = useMemo(() => {
    return [
      {
        title: t('common.explorer'),
        icon:
          currency.chainId === UniverseChainId.Mainnet ? (
            <EtherscanLogo width="18px" height="18px" fill={colors.neutral1.val} />
          ) : (
            <ExplorerIcon width="18px" height="18px" fill={colors.neutral1.val} />
          ),
        onPress: () => window.open(explorerUrl, '_blank'),
        show: !!explorerUrl,
      },
      {
        title: t('common.website'),
        icon: <Globe width="18px" height="18px" fill={colors.neutral1.val} />,
        onPress: () => window.open(homepageUrl, '_blank'),
        show: !!homepageUrl,
      },
      {
        title: t('common.twitter'),
        icon: <TwitterXLogo width="18px" height="18px" fill={colors.neutral1.val} />,
        onPress: () => window.open(twitterUrl, '_blank'),
        show: !!twitterUrl,
      },
      {
        title: isCopied ? t('common.copied') : t('common.copyLink.button'),
        icon: isCopied ? (
          <Check size={16} p={1} color={colors.statusSuccess.val} />
        ) : (
          <Link size={18} color={colors.neutral1.val} />
        ),
        onPress: () => setCopied(currentLocation),
        show: isMobileScreen,
      },
      {
        title: t('common.share.shareToTwitter'),
        icon: <ShareIcon fill={colors.neutral1.val} width={18} height={18} />,
        onPress: () => openShareTweetWindow(twitterShareName),
        show: isMobileScreen,
      },
    ]
  }, [
    explorerUrl,
    homepageUrl,
    twitterUrl,
    currency.chainId,
    colors,
    t,
    isCopied,
    setCopied,
    currentLocation,
    isMobileScreen,
    twitterShareName,
  ])

  return (
    <>
      <TokenNameCell>
        <PortfolioLogo currencies={[currency]} chainId={currency.chainId} size={32} />
        <Flex row gap="$gap8" alignItems="center" overflow="hidden">
          <Text variant="heading3" minWidth={40} {...EllipsisTamaguiStyle}>
            {currency.name ?? t('tdp.nameNotFound')}
          </Text>
          <Text variant="heading3" textTransform="uppercase" color="$neutral2" $sm={{ display: 'none' }}>
            {tokenSymbolName}
          </Text>
        </Flex>
      </TokenNameCell>
      {isMobileScreen ? (
        <Flex>
          <Text onPress={() => toggleMobileSheet(true)} {...ActionButtonStyle}>
            <MoreHorizontal size={iconSizes.icon20} color={colors.neutral2.val} />
          </Text>
          <WebBottomSheet isOpen={isMobileScreen && mobileSheetOpen} onClose={() => toggleMobileSheet(false)}>
            <Flex gap="$spacing8" mb="$spacing16">
              {HeaderActions.map(
                (action) =>
                  action.show && (
                    <Flex
                      row
                      key={action.title}
                      width="100%"
                      gap="$spacing12"
                      px="$spacing8"
                      py={10}
                      alignItems="center"
                      hoverStyle={{ backgroundColor: '$surface3' }}
                      cursor="pointer"
                      borderRadius="$rounded8"
                      onPress={() => {
                        toggleMobileSheet(false)
                        action.onPress()
                      }}
                    >
                      {action.icon}
                      <Text variant="body2">{action.title}</Text>
                    </Flex>
                  ),
              )}
            </Flex>
          </WebBottomSheet>
        </Flex>
      ) : (
        <Flex row gap="$gap8" alignItems="center">
          {HeaderActions.map(
            (action) =>
              action.show && (
                <MouseoverTooltip key={action.title} text={action.title} placement="top" size={TooltipSize.Max}>
                  <Text onPress={action.onPress} {...ActionButtonStyle}>
                    {action.icon}
                  </Text>
                </MouseoverTooltip>
              ),
          )}
          <ShareButton name={twitterShareName} utmSource="share-tdp" />
        </Flex>
      )}
    </>
  )
}

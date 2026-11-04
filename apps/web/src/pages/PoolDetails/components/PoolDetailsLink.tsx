import { UniverseChainId, Platform, getValidAddress } from '@universe/chains'
import {
  Anchor,
  Flex,
  type FlexCompatProps,
  Text,
  type TextCompatProps,
  TouchableArea,
  type TouchableAreaCompatProps,
  View,
  type ViewCompatProps,
} from '@universe/mycelium'
import { CopySheets } from '@universe/mycelium/icons/CopySheets'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { isNativeParsedToken, v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { LoadingBubble } from '~/components/Tokens/loading'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getTokenDetailsURL } from '~/data/util'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from '~/theme/components/styles'
import { anonymizeLink } from '~/utils/anonymizeLink'

// `transition-opacity`, not `all`: `all` animates theme tokens and flashes on a light/dark toggle.
const CLICKABLE_STYLE = { ...ClickableTamaguiStyle, style: { transition: 'opacity 100ms' } }

const TokenName = forwardRef<HTMLElement, TextCompatProps>(function TokenName(
  { $xl: xl, $sm: sm, '$platform-web': platformWeb, ...props },
  ref,
) {
  return (
    <Text
      ref={ref}
      display="none"
      minWidth={0}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $platform-web={{ ...EllipsisTamaguiStyle['$platform-web'], ...platformWeb }}
      $xl={{ display: 'block', ...xl }}
      $sm={{ display: 'none', ...sm }}
      {...props}
    />
  )
})

const TokenTextWrapper = forwardRef<HTMLDivElement, FlexCompatProps & { isClickable?: boolean }>(
  function TokenTextWrapper(
    { isClickable, hoverStyle, pressStyle, style, '$platform-web': platformWeb, ...props },
    ref,
  ) {
    // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
    // `style` is listed too: it carries the opacity transition, which a replacing spread would drop.
    const clickable = isClickable === true ? CLICKABLE_STYLE : undefined
    return (
      <Flex
        ref={ref}
        row
        gap="$gap8"
        mr="$spacing12"
        minWidth={0}
        flex={1}
        overflow="hidden"
        {...clickable}
        {...(clickable === undefined
          ? { hoverStyle, pressStyle, style, '$platform-web': platformWeb }
          : {
              hoverStyle: { ...clickable.hoverStyle, ...hoverStyle },
              pressStyle: { ...clickable.pressStyle, ...pressStyle },
              style: { ...clickable.style, ...style },
              '$platform-web': { ...clickable['$platform-web'], ...platformWeb },
            })}
        {...props}
      />
    )
  },
)

const TokenTextContent = forwardRef<HTMLDivElement, FlexCompatProps>(function TokenTextContent(props, ref) {
  return <Flex ref={ref} row gap="$gap8" flex={1} minWidth={0} overflow="hidden" {...props} />
})

const SymbolText = forwardRef<HTMLElement, TextCompatProps>(function SymbolText(
  { $xl: xl, $sm: sm, '$platform-web': platformWeb, ...props },
  ref,
) {
  return (
    <Text
      ref={ref}
      minWidth={0}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $platform-web={{ ...EllipsisTamaguiStyle['$platform-web'], ...platformWeb }}
      $xl={{ color: '$neutral2', ...xl }}
      $sm={{ color: '$neutral1', ...sm }}
      {...props}
    />
  )
})

const CopyAddressContainer = forwardRef<HTMLElement, TouchableAreaCompatProps>(
  function CopyAddressContainer(props, ref) {
    return (
      <TouchableArea
        ref={ref}
        flexDirection="row"
        alignItems="center"
        gap="$gap8"
        py="$padding8"
        px="$padding12"
        borderRadius={20}
        backgroundColor="$surface3"
        width="max-content"
        flexShrink={0}
        {...props}
      />
    )
  },
)

const ExplorerWrapper = forwardRef<HTMLDivElement, ViewCompatProps>(function ExplorerWrapper(
  { hoverStyle, pressStyle, style, '$platform-web': platformWeb, ...props },
  ref,
) {
  return (
    <View
      ref={ref}
      p="$padding8"
      borderRadius={20}
      backgroundColor="$surface3"
      display="flex"
      {...CLICKABLE_STYLE}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      // `style` is listed too: it carries the opacity transition, which a replacing spread would drop.
      hoverStyle={{ ...CLICKABLE_STYLE.hoverStyle, ...hoverStyle }}
      pressStyle={{ ...CLICKABLE_STYLE.pressStyle, ...pressStyle }}
      style={{ ...CLICKABLE_STYLE.style, ...style }}
      $platform-web={{ ...CLICKABLE_STYLE['$platform-web'], ...platformWeb }}
      {...props}
    />
  )
})

const ButtonsRow = forwardRef<HTMLDivElement, FlexCompatProps>(function ButtonsRow(props, ref) {
  return <Flex ref={ref} row gap="$gap8" flexShrink={0} width="max-content" {...props} />
})

interface PoolDetailsLinkProps {
  address?: string
  chainId?: UniverseChainId
  tokens: (ParsedToken | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, chainId, tokens, loading }: PoolDetailsLinkProps) {
  const colors = useSporeColors()
  const ExplorerLogo = useBlockExplorerLogo(chainId)
  const { t } = useTranslation()
  const currency = tokens[0] && v2TokenToCurrency(tokens[0])
  const currencyInfo = useCurrencyInfo(currencyId(currency))
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    const checksummedAddress = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
    checksummedAddress && setCopied(checksummedAddress)
  }, [address, setCopied])
  const isPool = tokens.length === 2
  const isNative = address === NATIVE_CHAIN_ID || Boolean(!isPool && tokens[0] && isNativeParsedToken(tokens[0]))
  const currencies = isPool && tokens[1] ? [currency, v2TokenToCurrency(tokens[1])] : [currency]
  // The page's GetPool row already carries both logos; see AnimatedDoubleLogo for why the pair logo wants them.
  const servedLogos = isPool ? currencies.map((leg, i) => ({ currency: leg, logoUrl: tokens[i]?.logoUrl })) : undefined
  const explorerUrl =
    chainId &&
    getExplorerLink({
      chainId,
      data: address ?? '',
      type: isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    })

  const handleExplorerLinkPress = useCallback(() => {
    if (!explorerUrl) {
      return
    }
    sendAnalyticsEvent(InterfaceEventName.ExternalLinkClicked, {
      label: anonymizeLink(explorerUrl),
    })
  }, [explorerUrl])

  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.address, chainId: chainId ?? defaultChainId }))
    }
  }, [navigate, tokens, isPool, chainId, defaultChainId])

  const [truncateAddress, setTruncateAddress] = useState<false | 'start' | 'both'>(false)
  const onTextRender = useCallback(
    (textRef: HTMLElement | null) => {
      if (textRef) {
        const hasOverflow = textRef.clientWidth < textRef.scrollWidth
        if (hasOverflow) {
          setTruncateAddress((prev) => (prev ? 'both' : 'start'))
        }
      }
    },
    // This callback must run after it sets truncateAddress to 'start' to see if it needs to 'both'.
    // It checks if the textRef has overflow, and sets truncateAddress accordingly to avoid it.
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    [truncateAddress],
  )

  if (loading || !chainId) {
    return (
      <Flex gap="$spacing8">
        <LoadingBubble width="100%" containerProps={{ width: '100%' }} />
        <LoadingBubble width="100%" containerProps={{ width: '100%' }} />
      </Flex>
    )
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <TokenTextWrapper
        data-testid={
          isPool ? `pdp-pool-logo-${tokens[0]?.symbol}-${tokens[1]?.symbol}` : `pdp-token-logo-${tokens[0]?.symbol}`
        }
        isClickable={!isPool}
        onPress={handleTokenTextClick}
        ref={onTextRender}
      >
        {isPool ? (
          <DoubleCurrencyLogo currencies={currencies} servedLogos={servedLogos} size={20} />
        ) : (
          <CurrencyLogo currencyInfo={currencyInfo} size={20} />
        )}
        <TokenTextContent>
          <TokenName>{isPool ? t('common.pool') : tokens[0]?.name}</TokenName>
          <SymbolText>
            {isPool ? (
              `${tokens[0]?.symbol} / ${tokens[1]?.symbol}`
            ) : (
              <Flex row gap="$spacing4">
                {tokens[0]?.symbol} <RotatableChevron direction="right" size="$icon.16" color="$neutral2" />
              </Flex>
            )}
          </SymbolText>
        </TokenTextContent>
      </TokenTextWrapper>
      <ButtonsRow>
        {!isNative && (
          <MouseoverTooltip
            disabled
            forceShow={isCopied}
            placement="bottom"
            size={TooltipSize.Max}
            text={t('common.copied')}
          >
            <CopyAddressContainer data-testid={`copy-address-${address}`} onPress={copy}>
              {/* Source class, not a Tamagui group-hover prop: new Tamagui styling is banned here. */}
              <Text
                variant="buttonLabel3"
                color="$neutral1"
                className="group-hover:[color:var(--stext-neutral1Hovered)]"
              >
                {shortenAddress({
                  address,
                  chars: truncateAddress ? 2 : undefined,
                  charsEnd: truncateAddress === 'both' ? 2 : undefined,
                })}
              </Text>
              <CopySheets size="$icon.16" color="$neutral2" flexShrink={0} />
            </CopyAddressContainer>
          </MouseoverTooltip>
        )}
        {explorerUrl && (
          <Anchor
            color={colors.neutral1.val}
            data-testid={`explorer-url-${explorerUrl}`}
            href={explorerUrl}
            rel="noopener noreferrer"
            target="_blank"
            textDecorationLine="none"
            onPress={handleExplorerLinkPress}
          >
            <ExplorerWrapper>
              <ExplorerLogo size="$icon.16" color={colors.neutral1.val} />
            </ExplorerWrapper>
          </Anchor>
        )}
      </ButtonsRow>
    </Flex>
  )
}

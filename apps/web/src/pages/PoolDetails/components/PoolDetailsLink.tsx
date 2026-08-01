import { GraphQLApi } from '@universe/api'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Anchor, Flex, styled, Text, TouchableArea, useSporeColors, View } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { getTokenDetailsURL, gqlToCurrency } from '~/appGraphql/data/util'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { LoadingBubble } from '~/components/Tokens/loading'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from '~/theme/components/styles'
import { anonymizeLink } from '~/utils/anonymizeLink'
import { getChainUrlParam } from '~/utils/params/chainParams'

const TokenName = styled(Text, {
  display: 'none',
  minWidth: 0,
  ...EllipsisTamaguiStyle,
  $xl: {
    display: 'block',
  },
  $sm: {
    display: 'none',
  },
})

const TokenTextWrapper = styled(Flex, {
  row: true,
  gap: '$gap8',
  mr: '$spacing12',
  minWidth: 0,
  flex: 1,
  overflow: 'hidden',
  variants: {
    isClickable: {
      true: ClickableTamaguiStyle,
    },
  },
})

const TokenTextContent = styled(Flex, {
  row: true,
  gap: '$gap8',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
})

const SymbolText = styled(Text, {
  minWidth: 0,
  ...EllipsisTamaguiStyle,
  $xl: {
    color: '$neutral2',
  },
  $sm: {
    color: '$neutral1',
  },
})

const CopyAddressContainer = styled(TouchableArea, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
  py: '$padding8',
  px: '$padding12',
  borderRadius: 20,
  backgroundColor: '$surface3',
  width: 'max-content',
  flexShrink: 0,
})

const ExplorerWrapper = styled(View, {
  p: '$padding8',
  borderRadius: 20,
  backgroundColor: '$surface3',
  display: 'flex',
  ...ClickableTamaguiStyle,
})

const ButtonsRow = styled(Flex, {
  row: true,
  gap: '$gap8',
  flexShrink: 0,
  width: 'max-content',
})

interface PoolDetailsLinkProps {
  address?: string
  chainId?: UniverseChainId
  tokens: (GraphQLApi.Token | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, chainId, tokens, loading }: PoolDetailsLinkProps) {
  const colors = useSporeColors()
  const ExplorerLogo = useBlockExplorerLogo(chainId)
  const { t } = useTranslation()
  const currency = tokens[0] && gqlToCurrency(tokens[0])
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    const checksummedAddress = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
    checksummedAddress && setCopied(checksummedAddress)
  }, [address, setCopied])
  const isPool = tokens.length === 2
  const isNative =
    address === NATIVE_CHAIN_ID || (tokens[0] && !isPool && tokens[0].standard === GraphQLApi.TokenStandard.Native)
  const currencies = isPool && tokens[1] ? [currency, gqlToCurrency(tokens[1])] : [currency]
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
  const chainUrlParam = getChainUrlParam(chainId ?? defaultChainId)
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.address, chainUrlParam }))
    }
  }, [navigate, tokens, isPool, chainUrlParam])

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
          <DoubleCurrencyLogo currencies={currencies} size={20} />
        ) : (
          <CurrencyLogo currency={currency} size={20} />
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
              <Text variant="buttonLabel3">
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

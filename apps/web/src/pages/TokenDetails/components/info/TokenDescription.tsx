import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useSwapTaxes } from '~/hooks/useSwapTaxes'
import { useMultichainPopoverContentProps } from '~/pages/TokenDetails/components/info/MultichainPillDropdown'
import {
  AddressPill,
  type AboutPillsProps,
  DescriptionBody,
  ExplorerPill,
  FeeTooltip,
  PermissionedActionRowDivider,
  PermissionedPill,
  TwitterPill,
  WebsitePill,
} from '~/pages/TokenDetails/components/info/TokenDescriptionPills'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPPermissionedState } from '~/pages/TokenDetails/hooks/useTDPPermissionedState'
import { useTokenAddressCopy } from '~/pages/TokenDetails/hooks/useTokenAddressCopy'

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

  const tokenAddress = effectiveCurrency.isNative ? undefined : effectiveCurrency.address
  // `isVerified` already requires a connected wallet AND `isPermissioned && isAllowlisted`,
  // matching the previous `!!account.address && ...` predicate.
  const { isVerified: showVerifiedPill, issuer } = useTDPPermissionedState({
    tokenAddress,
    chainId: effectiveCurrency.chainId,
  })

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

  const { inputTax: sellFee, outputTax: buyFee } = useSwapTaxes({
    inputTokenAddress: displayAddress,
    outputTokenAddress: displayAddress,
    tokenChainId: effectiveCurrency.chainId,
  })
  const { formatPercent } = useLocalizationContext()
  const sellFeeString = formatPercent(sellFee.toSignificant())
  const buyFeeString = formatPercent(buyFee.toSignificant())
  const hasFee = Boolean(parseFloat(sellFeeString)) || Boolean(parseFloat(buyFee.toFixed(2)))

  const ExplorerIcon = getBlockExplorerIcon(effectiveCurrency.chainId)
  const explorerName = getChainInfo(effectiveCurrency.chainId).explorer.name

  // The MultichainTokenUx feature flag was removed on main; the multichain TDP UX now ships ungated.
  const showMultichainDropdowns = hasMultipleChains && !selectedMultichainChainId
  const aboutPillsProps: AboutPillsProps = {
    isNative: effectiveCurrency.isNative,
    showMultichainDropdowns,
    selectedMultichainChainId,
    multichainEntries,
    multichainPopoverContentProps,
    onCopyMultichainAddress,
    isAddressOpen,
    setIsAddressOpen,
    isExplorerOpen,
    setIsExplorerOpen,
    copy,
    isCopied,
    displayAddress,
    explorerUrl,
    explorerName,
    ExplorerIcon,
    homepageUrl,
    twitterName,
    handleExplorerPress,
    handleSingleChainExplorerPress,
  }

  return (
    <Flex data-testid={TestID.TokenDetailsAboutSection} gap="$gap20" width="100%" $md={{ gap: '$gap16' }}>
      <Text variant="heading3">{t('common.about')}</Text>
      <DescriptionBody description={description} />
      <Flex
        row
        flexWrap="wrap"
        gap="$gap12"
        alignItems="center"
        width="100%"
        data-testid={TestID.TokenDetailsAboutLinks}
      >
        {showVerifiedPill && (
          <>
            <PermissionedPill issuer={issuer} />
            <PermissionedActionRowDivider />
          </>
        )}
        <AddressPill {...aboutPillsProps} />
        <ExplorerPill {...aboutPillsProps} />
        <WebsitePill homepageUrl={homepageUrl} />
        <TwitterPill twitterName={twitterName} />
      </Flex>
      {hasFee && (
        <FeeTooltip symbol={effectiveCurrency.symbol} buyFeeString={buyFeeString} sellFeeString={sellFeeString} />
      )}
    </Flex>
  )
}

import { Currency } from '@uniswap/sdk-core'
import { areAddressesEqual, type UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniswapContext, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { areCurrenciesEqual, currencyAddress } from 'uniswap/src/utils/currencyId'
import { VerifyIdentityModal } from '~/components/PermissionedPool/VerifyIdentityModal'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getTokenDetailsURL } from '~/data/util'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useCurrency } from '~/hooks/Tokens'
import { Swap } from '~/pages/Swap'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPPermissionedState } from '~/pages/TokenDetails/hooks/useTDPPermissionedState'
import { useTDPSwapCurrency } from '~/pages/TokenDetails/hooks/useTDPSwapCurrency'
import { useUserPreservedCurrencies } from '~/pages/TokenDetails/hooks/useUserPreservedCurrencies'
import { getInitialLogoUrl } from '~/utils/getInitialLogoURL'

// The token warning card is owned by TokenDetailsContent, which renders it here on desktop and in
// the left panel below xl — this widget stays mounted-but-hidden there, so a card of its own would
// be a second live mount duplicating the warning's Blockaid fee-comparison analytics.
export function TDPSwapComponent({ warningCard }: { warningCard?: ReactNode }) {
  const { address, currency, currencyChainId, tokenColor, multiChainMap } = useTDPStore((s) => ({
    address: s.address,
    currency: s.currency!,
    currencyChainId: s.currencyChainId,
    tokenColor: s.tokenColor,
    multiChainMap: s.multiChainMap,
  }))
  const navigate = useNavigate()
  const swapCurrency = useTDPSwapCurrency()
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const { setSelectedMultichainChainId } = useTDPSelectedMultichainChain()

  // Widget mounts-but-hidden at ≤xl, so chain-filter churn fires a ghost toast.
  // Silence onSwapChainsChanged only when hidden; passthrough when visible (iPad landscape, desktop).
  const media = useMedia()
  const parentUniswapContext = useUniswapContext()
  const uniswapContextOverride = useMemo(
    () => (media.xl ? { ...parentUniswapContext, onSwapChainsChanged: () => {} } : parentUniswapContext),
    [parentUniswapContext, media.xl],
  )

  const tokenAddress = currency.isNative ? undefined : currency.address
  const tokenChainId = currency.chainId
  const {
    isBlocked: isPermissionedBlocked,
    kycUrl: permissionedRegistrationUrl,
    issuer: permissionedIssuer,
  } = useTDPPermissionedState({
    tokenAddress,
    chainId: tokenChainId,
  })

  const { inputCurrency, outputCurrency } = useSwapInitialCurrencies(swapCurrency)

  // If the initial input currency is the same as the swap currency, then we are selling the TDP currency
  const computedOutputCurrency = useMemo((): Currency | undefined => {
    if (
      areCurrenciesEqual(inputCurrency, swapCurrency) &&
      // ensure the output is not equal to the input before setting
      !areCurrenciesEqual(outputCurrency, inputCurrency)
    ) {
      return outputCurrency
    }

    // ensure the swap currency is not equal to the input before setting
    if (areCurrenciesEqual(swapCurrency, inputCurrency)) {
      return undefined
    }

    return swapCurrency
  }, [swapCurrency, inputCurrency, outputCurrency])

  const {
    inputCurrency: initialInputCurrency,
    outputCurrency: initialOutputCurrency,
    markInteracted,
  } = useUserPreservedCurrencies(inputCurrency, computedOutputCurrency)

  // Chain of the given currency if it is a deployment of the page token, else undefined.
  const getPageTokenDeploymentChainId = useCallback(
    (candidate: Currency | undefined): UniverseChainId | undefined => {
      if (!candidate || !isUniverseChainId(candidate.chainId)) {
        return undefined
      }

      const isPageToken =
        candidate.chainId === currencyChainId &&
        areAddressesEqual({
          addressInput1: { address: getCurrencyURLAddress(candidate), chainId: candidate.chainId },
          addressInput2: { address, chainId: currencyChainId },
        })
      if (isPageToken) {
        return candidate.chainId
      }

      const candidateAddress = candidate.isNative ? getNativeAddress(candidate.chainId) : candidate.address
      return multichainEntries.find(
        (entry) =>
          entry.chainId === candidate.chainId &&
          areAddressesEqual({
            addressInput1: { address: entry.address, chainId: entry.chainId },
            addressInput2: { address: candidateAddress, chainId: candidate.chainId },
          }),
      )?.chainId
    },
    [address, currencyChainId, multichainEntries],
  )

  const handleCurrencyChange = useCallback(
    (tokens: CurrencyState, selectedCurrency?: Currency) => {
      const inputDeploymentChainId = getPageTokenDeploymentChainId(tokens.inputCurrency)
      const outputDeploymentChainId = getPageTokenDeploymentChainId(tokens.outputCurrency)

      // Page token still in the pair on the widget's current chain — nothing to sync.
      if (inputDeploymentChainId === swapCurrency.chainId || outputDeploymentChainId === swapCurrency.chainId) {
        return
      }

      // Page token moved to another of its deployments — follow it with the network filter instead of
      // navigating (shallow URL replace, same as the header network selector).
      const deploymentChainId = inputDeploymentChainId ?? outputDeploymentChainId
      if (deploymentChainId !== undefined) {
        setSelectedMultichainChainId(deploymentChainId)
        return
      }

      // Page token left the pair entirely — the selection had no route to it, so the widget dropped
      // it (Swap clears the opposite token here). The TDP parallel: go to the new token's page.
      if (!selectedCurrency || !isUniverseChainId(selectedCurrency.chainId)) {
        return
      }
      const preloadedLogoSrc = getInitialLogoUrl({
        address: selectedCurrency.wrapped.address,
        chainId: selectedCurrency.chainId,
      })
      const url = getTokenDetailsURL({
        address: selectedCurrency.isNative ? null : selectedCurrency.address,
        chain: toGraphQLChain(selectedCurrency.chainId),
        inputAddress: getCurrencyURLAddress(tokens.inputCurrency),
        outputAddress: getCurrencyURLAddress(tokens.outputCurrency),
      })
      navigate(url, { state: { preloadedLogoSrc } })
    },
    [getPageTokenDeploymentChainId, swapCurrency.chainId, setSelectedMultichainChainId, navigate],
  )

  return (
    <Flex gap="$gap12">
      {/* TODO(SWAP-2334): Update interaction detection after swap flow refactor */}
      {/* oxlint-disable-next-line react/forbid-elements -- raw div needed for onPointerDownCapture */}
      <div onPointerDownCapture={markInteracted}>
        <UniswapContext.Provider value={uniswapContextOverride}>
          <Swap
            syncTabToUrl={false}
            hideChart={true}
            initialInputChainId={swapCurrency.chainId}
            initialInputCurrency={initialInputCurrency}
            initialOutputCurrency={initialOutputCurrency}
            onCurrencyChange={handleCurrencyChange}
            tokenColor={tokenColor}
            tdpCurrency={swapCurrency}
            hideBlastShutdownModal={media.xl}
          />
        </UniswapContext.Provider>
      </div>
      {warningCard}
      {isPermissionedBlocked && permissionedRegistrationUrl && (
        <VerifyIdentityModal
          tokenSymbol={currency.symbol ?? ''}
          registrationUrl={permissionedRegistrationUrl}
          // Pass the raw issuer (no `?? ''` fallback): an empty issuer must reach the modal's
          // missing-config guard so it renders the "verification temporarily unavailable" copy
          // instead of interpolating a blank provider name (matches the LP/swap guard).
          issuer={permissionedIssuer}
        />
      )}
    </Flex>
  )
}

function getCurrencyURLAddress(currency?: Currency): string {
  if (!currency) {
    return ''
  }

  if (currency.isToken) {
    return currency.address
  }
  return NATIVE_CHAIN_ID
}

// Defaults to the chain's gas token, or undefined if the page token is itself the gas token.
// Note: Query string input currency takes precedence if it's set
function useSwapInitialCurrencies(swapCurrency: Currency) {
  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const gasToken = getChainGasToken(swapCurrency.chainId)
  const defaultCurrencyAddress = areCurrenciesEqual(gasToken, swapCurrency) ? undefined : currencyAddress(gasToken)

  const inputTokenAddress = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? parsedQs.inputCurrency : defaultCurrencyAddress
  }, [defaultCurrencyAddress, parsedQs.inputCurrency])

  const outputTokenAddress = useMemo(() => {
    return typeof parsedQs.outputCurrency === 'string' ? parsedQs.outputCurrency : defaultCurrencyAddress
  }, [defaultCurrencyAddress, parsedQs.outputCurrency])

  return {
    inputCurrency: useCurrency({
      address: inputTokenAddress,
      chainId: swapCurrency.chainId,
    }),
    outputCurrency: useCurrency({
      address: outputTokenAddress,
      chainId: swapCurrency.chainId,
    }),
  }
}

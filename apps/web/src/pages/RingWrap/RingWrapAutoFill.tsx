import { getFewTokenFromOriginalToken, isFewToken } from '@ring-protocol/few-v2-sdk'
import { /*Currency, */ Token } from '@uniswap/sdk-core'
import { useQueryClient } from 'appGraphql/data/apollo/client'
import gql from 'graphql-tag'
import { useEffect, useMemo, useState /*useMemo*/ } from 'react'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * GraphQL query to get token with originToken information
 */
const TOKEN_WITH_ORIGIN_QUERY = gql`
  query TokenWithOrigin($id: String!) {
    token(id: $id) {
      id
      chain
      address
      decimals
      name
      symbol
      standard
      originToken {
        address
        name
        symbol
        decimals
        standard
      }
    }
  }
`

/**
 * Helper function to find the origin token for a given few token in COMMON_BASES
 */
function findOriginTokenInCommonBases(fewToken: Token, chainId: UniverseChainId): Token | undefined {
  const commonBases = COMMON_BASES[chainId]
  if (!commonBases) {
    return undefined
  }

  for (const base of commonBases) {
    if (!base.currency.isToken) {
      continue
    }
    const baseToken = base.currency as Token
    // Skip if base token is already a few token
    if (isFewToken(baseToken)) {
      continue
    }
    // Check if this base token's few token matches the given few token
    try {
      const baseFewToken = getFewTokenFromOriginalToken(baseToken, chainId)
      if (areAddressesEqual(baseFewToken.address, fewToken.address)) {
        return baseToken
      }
    } catch {
      // Skip if getFewTokenFromOriginalToken fails
      continue
    }
  }

  return undefined
}

/**
 * Helper function to find the origin token for a given few token via GraphQL query
 */
async function findOriginTokenViaGraphQL(
  fewToken: Token,
  chainId: UniverseChainId,
  client: ReturnType<typeof useQueryClient>,
): Promise<Token | undefined> {
  try {
    const graphQLChain = toGraphQLChain(chainId)
    if (!graphQLChain) {
      return undefined
    }

    const tokenId = `Token:${graphQLChain}_${fewToken.address.toLowerCase()}`

    const { data } = await client.query({
      query: TOKEN_WITH_ORIGIN_QUERY,
      variables: { id: tokenId },
      fetchPolicy: 'cache-first',
    })

    const originTokenData = data?.token?.originToken
    if (originTokenData?.address && originTokenData?.decimals !== null && originTokenData?.decimals !== undefined) {
      return new Token(
        chainId,
        originTokenData.address,
        originTokenData.decimals,
        originTokenData.symbol ?? undefined,
        originTokenData.name ?? undefined,
      )
    }
  } catch {
    // GraphQL query failed, return undefined
    // Silently fail - will fallback to COMMON_BASES or manual selection
  }

  return undefined
}

/**
 * Auto-fills OUTPUT token when user selects INPUT token for FewWrap
 * - INPUT = Origin Token → Auto set OUTPUT to FewToken (FewWrap)
 * - INPUT = FewToken → Auto set OUTPUT to Origin Token (FewUnwrap)
 * - OUTPUT = Origin Token → Auto set INPUT to FewToken (FewUnwrap)
 * - OUTPUT = FewToken → Auto set INPUT to Origin Token (FewWrap)
 */
export function FewTokenOutputAutoUpdater({ enabled }: { enabled: boolean }) {
  const { input, output, updateSwapForm, filteredChainIds, derivedSwapInfo } = useSwapFormContext()
  const [loadingOriginToken, setLoadingOriginToken] = useState(false)

  // Get GraphQL chain for the current input/output
  const graphQLChain = useMemo(() => {
    if (input?.chainId) {
      return toGraphQLChain(input.chainId)
    }
    if (output?.chainId) {
      return toGraphQLChain(output.chainId)
    }
    return null
  }, [input?.chainId, output?.chainId])

  // Get GraphQL clients for supported chains (must call hooks unconditionally)
  // useQueryClient only supports Ethereum and Hyper chains
  const ethClient = useQueryClient(Chain.Ethereum)
  const hyperClient = useQueryClient(Chain.Hyper)

  // Select the appropriate client based on the chain
  const graphQLClient = useMemo(() => {
    if (!graphQLChain) {
      return null
    }
    if (graphQLChain === Chain.Ethereum) {
      return ethClient
    }
    if (graphQLChain === Chain.Hyper) {
      return hyperClient
    }
    return null
  }, [graphQLChain, ethClient, hyperClient])

  useEffect(() => {
    // If not enabled, clear input.
    if (!enabled) {
      if (derivedSwapInfo.wrapType === WrapType.FewWrap) {
        if (output) {
          updateSwapForm({ output: undefined })
        }
      } else if (derivedSwapInfo.wrapType === WrapType.FewUnwrap) {
        if (input) {
          updateSwapForm({ input: undefined })
        }
      }
      return
    }
    if (!input && !output) {
      return
    }
    // Get the full Currency object from derivedSwapInfo
    const inputCurrency = derivedSwapInfo?.currencies[CurrencyField.INPUT]?.currency
    const outputCurrency = derivedSwapInfo?.currencies[CurrencyField.OUTPUT]?.currency
    if (!inputCurrency && !outputCurrency) {
      return
    }
    const focusOnCurrencyField = derivedSwapInfo?.focusOnCurrencyField

    // const exactCurrencyField = derivedSwapInfo?.exactCurrencyField
    if (inputCurrency && focusOnCurrencyField === CurrencyField.INPUT) {
      // Convert to Token (use wrapped version for native currencies)
      const inputToken = inputCurrency.isNative ? inputCurrency.wrapped : (inputCurrency as Token)

      // Case 1: INPUT is Origin Token → Auto set OUTPUT to FewToken (FewWrap)
      if (!isFewToken(inputToken) && input) {
        // Get the corresponding FEW token
        let fewToken
        try {
          fewToken = getFewTokenFromOriginalToken(inputToken, input.chainId)
        } catch {
          return
        }

        // Convert FEW Token to TradeableAsset for the output field
        const fewTokenAsset = currencyToAsset(fewToken)

        // Check if output is already the expected FEW token
        const isOutputExpected =
          !!output &&
          fewTokenAsset &&
          output.chainId === fewTokenAsset.chainId &&
          areAddressesEqual(output.address, fewTokenAsset.address)

        // Only update if output is not already the FEW token
        if (!isOutputExpected && fewTokenAsset) {
          updateSwapForm({
            output: fewTokenAsset,
            filteredChainIds: {
              ...filteredChainIds,
              [CurrencyField.INPUT]: input.chainId as UniverseChainId,
              [CurrencyField.OUTPUT]: fewTokenAsset.chainId as UniverseChainId,
            },
          })
        }
      }
      // Case 2: INPUT is FewToken → Auto set OUTPUT to Origin Token (FewUnwrap)
      else if (isFewToken(inputToken) && input && !loadingOriginToken) {
        // First try to find in COMMON_BASES (synchronous, fast)
        let originToken = findOriginTokenInCommonBases(inputToken, input.chainId)

        // If not found and GraphQL client is available, try GraphQL query
        if (!originToken && graphQLClient) {
          setLoadingOriginToken(true)
          findOriginTokenViaGraphQL(inputToken, input.chainId, graphQLClient)
            .then((graphQLOriginToken) => {
              originToken = graphQLOriginToken
              if (originToken) {
                // Convert Origin Token to TradeableAsset for the output field
                const originTokenAsset = currencyToAsset(originToken)

                // Check if output is already the expected origin token
                const isOutputExpected =
                  !!output &&
                  originTokenAsset &&
                  output.chainId === originTokenAsset.chainId &&
                  areAddressesEqual(output.address, originTokenAsset.address)

                // Only update if output is not already the origin token
                if (!isOutputExpected && originTokenAsset) {
                  updateSwapForm({
                    output: originTokenAsset,
                    filteredChainIds: {
                      ...filteredChainIds,
                      [CurrencyField.INPUT]: input.chainId as UniverseChainId,
                      [CurrencyField.OUTPUT]: originTokenAsset.chainId as UniverseChainId,
                    },
                  })
                }
              }
            })
            .catch(() => {
              // GraphQL query failed, silently fail - will fallback to manual selection
            })
            .finally(() => {
              setLoadingOriginToken(false)
            })
        } else if (originToken) {
          // Found in COMMON_BASES, update immediately
          const originTokenAsset = currencyToAsset(originToken)

          // Check if output is already the expected origin token
          const isOutputExpected =
            !!output &&
            originTokenAsset &&
            output.chainId === originTokenAsset.chainId &&
            areAddressesEqual(output.address, originTokenAsset.address)

          // Only update if output is not already the origin token
          if (!isOutputExpected && originTokenAsset) {
            updateSwapForm({
              output: originTokenAsset,
              filteredChainIds: {
                ...filteredChainIds,
                [CurrencyField.INPUT]: input.chainId as UniverseChainId,
                [CurrencyField.OUTPUT]: originTokenAsset.chainId as UniverseChainId,
              },
            })
          }
        }
      }
    } else if (outputCurrency && focusOnCurrencyField === CurrencyField.OUTPUT) {
      // Convert to Token (use wrapped version for native currencies)
      const outputToken = outputCurrency.isNative ? outputCurrency.wrapped : (outputCurrency as Token)

      // Case 1: OUTPUT is Origin Token → Auto set INPUT to FewToken (FewUnwrap)
      if (!isFewToken(outputToken) && output) {
        // Get the corresponding FEW token
        let fewToken
        try {
          fewToken = getFewTokenFromOriginalToken(outputToken, output.chainId)
        } catch {
          return
        }

        // Convert FEW Token to TradeableAsset for the input field
        const fewTokenAsset = currencyToAsset(fewToken)

        // Check if input is already the expected FEW token
        const isInputExpected =
          !!input &&
          fewTokenAsset &&
          input.chainId === fewTokenAsset.chainId &&
          areAddressesEqual(input.address, fewTokenAsset.address)

        // Only update if input is not already the FEW token
        if (!isInputExpected && fewTokenAsset) {
          updateSwapForm({
            input: fewTokenAsset,
            filteredChainIds: {
              ...filteredChainIds,
              [CurrencyField.INPUT]: fewTokenAsset.chainId as UniverseChainId,
              [CurrencyField.OUTPUT]: output.chainId as UniverseChainId,
            },
          })
        }
      }
      // Case 2: OUTPUT is FewToken → Auto set INPUT to Origin Token (FewWrap)
      else if (isFewToken(outputToken) && output && !loadingOriginToken) {
        // First try to find in COMMON_BASES (synchronous, fast)
        let originToken = findOriginTokenInCommonBases(outputToken, output.chainId)

        // If not found and GraphQL client is available, try GraphQL query
        if (!originToken && graphQLClient) {
          setLoadingOriginToken(true)
          findOriginTokenViaGraphQL(outputToken, output.chainId, graphQLClient)
            .then((graphQLOriginToken) => {
              originToken = graphQLOriginToken
              if (originToken) {
                // Convert Origin Token to TradeableAsset for the input field
                const originTokenAsset = currencyToAsset(originToken)

                // Check if input is already the expected origin token
                const isInputExpected =
                  !!input &&
                  originTokenAsset &&
                  input.chainId === originTokenAsset.chainId &&
                  areAddressesEqual(input.address, originTokenAsset.address)

                // Only update if input is not already the origin token
                if (!isInputExpected && originTokenAsset) {
                  updateSwapForm({
                    input: originTokenAsset,
                    filteredChainIds: {
                      ...filteredChainIds,
                      [CurrencyField.INPUT]: originTokenAsset.chainId as UniverseChainId,
                      [CurrencyField.OUTPUT]: output.chainId as UniverseChainId,
                    },
                  })
                }
              }
            })
            .catch(() => {
              // GraphQL query failed, silently fail - will fallback to manual selection
            })
            .finally(() => {
              setLoadingOriginToken(false)
            })
        } else if (originToken) {
          // Found in COMMON_BASES, update immediately
          const originTokenAsset = currencyToAsset(originToken)

          // Check if input is already the expected origin token
          const isInputExpected =
            !!input &&
            originTokenAsset &&
            input.chainId === originTokenAsset.chainId &&
            areAddressesEqual(input.address, originTokenAsset.address)

          // Only update if input is not already the origin token
          if (!isInputExpected && originTokenAsset) {
            updateSwapForm({
              input: originTokenAsset,
              filteredChainIds: {
                ...filteredChainIds,
                [CurrencyField.INPUT]: originTokenAsset.chainId as UniverseChainId,
                [CurrencyField.OUTPUT]: output.chainId as UniverseChainId,
              },
            })
          }
        }
      }
    }
  }, [enabled, input, output, updateSwapForm, filteredChainIds, derivedSwapInfo, loadingOriginToken, graphQLClient])

  return null
}

import { Currency, Token } from '@uniswap/sdk-core'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { Flex, Text } from 'ui/src'
import { spacing, zIndexes } from 'ui/src/theme'
import { TOKEN_SELECTOR_WEB_MAX_WIDTH } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { filter as filterTokenOptions } from 'uniswap/src/components/TokenSelector/filter'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { isAddress } from 'utilities/src/addresses'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContracts } from 'wagmi'

const fewTokenAbi = [
  {
    constant: true,
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const

type FewTokenCurrencySearchModalProps = {
  isOpen: boolean
  onDismiss: () => void
  onCurrencySelect: (currency: Currency) => void
  chainIds?: UniverseChainId[]
  tokens: Token[]
}

function toCurrencyInfo(token: Token): CurrencyInfo {
  const tokenWithLogo = token as Token & { logoURI?: string }
  return {
    currency: token,
    currencyId: currencyId(token),
    logoUrl: tokenWithLogo.logoURI ?? null,
  }
}

export default memo(function FewTokenCurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  chainIds,
  tokens,
}: FewTokenCurrencySearchModalProps) {
  const { t } = useTranslation()
  const { chainId: selectedChainId } = useMultichainContext()
  const [searchFilter, setSearchFilter] = useState('')
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(selectedChainId ?? chainIds?.[0] ?? null)
  const searchAddress = useMemo(() => isAddress(searchFilter.trim()) ?? undefined, [searchFilter])

  const { data: importedTokenMetadata, isLoading: importedTokenLoading } = useReadContracts({
    contracts:
      searchAddress && chainFilter
        ? [
            {
              address: assume0xAddress(searchAddress) ?? '0x',
              abi: erc20Abi,
              functionName: 'symbol',
              chainId: chainFilter,
            },
            {
              address: assume0xAddress(searchAddress) ?? '0x',
              abi: erc20Abi,
              functionName: 'name',
              chainId: chainFilter,
            },
            {
              address: assume0xAddress(searchAddress) ?? '0x',
              abi: erc20Abi,
              functionName: 'decimals',
              chainId: chainFilter,
            },
            {
              address: assume0xAddress(searchAddress) ?? '0x',
              abi: fewTokenAbi,
              functionName: 'token',
              chainId: chainFilter,
            },
          ]
        : [],
  })

  const importedToken = useMemo(() => {
    if (!searchAddress || !chainFilter || !importedTokenMetadata) {
      return undefined
    }

    const [symbolResult, nameResult, decimalsResult, originTokenResult] = importedTokenMetadata
    const symbol = symbolResult?.result
    const name = nameResult?.result
    const decimals = decimalsResult?.result
    const originTokenAddress = originTokenResult?.result

    if (
      typeof symbol !== 'string' ||
      typeof name !== 'string' ||
      typeof decimals !== 'number' ||
      !isAddress(originTokenAddress)
    ) {
      return undefined
    }

    try {
      return new Token(chainFilter, searchAddress, decimals, symbol, name)
    } catch {
      return undefined
    }
  }, [chainFilter, importedTokenMetadata, searchAddress])

  const searchableTokens = useMemo(() => {
    if (!importedToken) {
      return tokens
    }

    const importedTokenAddress = importedToken.address.toLowerCase()
    return tokens.some(
      (token) => token.chainId === importedToken.chainId && token.address.toLowerCase() === importedTokenAddress,
    )
      ? tokens
      : [...tokens, importedToken]
  }, [importedToken, tokens])

  const tokenOptions = useMemo((): TokenOption[] => {
    const currencyInfos = searchableTokens.map(toCurrencyInfo)
    return currencyInfos.map((currencyInfo) => ({
      type: OnchainItemListOptionType.Token as const,
      currencyInfo,
      quantity: null,
      balanceUSD: undefined,
    }))
  }, [searchableTokens])

  const filteredTokenOptions = useMemo(
    () => filterTokenOptions(tokenOptions, chainFilter, searchFilter),
    [tokenOptions, chainFilter, searchFilter],
  )

  const sections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: filteredTokenOptions,
    name: t('common.tokens'),
  })

  const handleSelectCurrency: OnSelectCurrency = useCallback(
    (currencyInfo) => {
      onCurrencySelect(currencyInfo.currency)
      onDismiss()
    },
    [onCurrencySelect, onDismiss],
  )

  return (
    <Modal
      isModalOpen={isOpen}
      onClose={onDismiss}
      maxHeight={700}
      height="100vh"
      maxWidth={TOKEN_SELECTOR_WEB_MAX_WIDTH}
      padding={0}
      flex={1}
      name={ModalName.CurrencySearch}
    >
      <Flex grow gap="$spacing8">
        <Flex row justifyContent="space-between" pt="$spacing16" px="$spacing16">
          <Text variant="subheading1">{t('common.selectToken.label')}</Text>
        </Flex>
        <SearchTextInput
          autoFocus
          backgroundColor="$surface2"
          endAdornment={
            <Flex row alignItems="center">
              <NetworkFilter
                includeAllNetworks={false}
                chainIds={chainIds ?? []}
                selectedChain={chainFilter}
                styles={{ dropdownZIndex: zIndexes.overlay }}
                onPressChain={setChainFilter}
              />
            </Flex>
          }
          placeholder={t('tokens.selector.search.placeholder')}
          px="$spacing16"
          py="$none"
          mx={spacing.spacing16}
          my="$spacing4"
          value={searchFilter}
          onChangeText={setSearchFilter}
        />
        <Flex grow>
          <TokenSelectorList
            showTokenAddress
            chainFilter={chainFilter}
            loading={importedTokenLoading}
            sections={sections}
            showTokenWarnings={true}
            onSelectCurrency={handleSelectCurrency}
          />
        </Flex>
      </Flex>
    </Modal>
  )
})

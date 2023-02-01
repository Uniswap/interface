import { Trans, t } from '@lingui/macro'
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { RowBetween } from 'components/Row'
import { ContentWrapper, NoResult } from 'components/SearchModal/CurrencySearch'
import CurrencyListBridge from 'components/SearchModal/bridge/CurrencyListBridge'
import { useTokenComparator } from 'components/SearchModal/sorting'
import { PaddedColumn, SearchIcon, SearchInput, SearchWrapper, Separator } from 'components/SearchModal/styleds'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { useBridgeState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { CloseIcon, ExternalLink } from 'theme'
import { isAddress } from 'utils'
import { filterTokens } from 'utils/filtering'

interface CurrencySearchBridgeProps {
  isOpen: boolean
  onDismiss: () => void
  isOutput?: boolean
  onCurrencySelect: (currency: WrappedTokenInfo) => void
}

export default function CurrencySearchBridge({
  isOutput,
  onCurrencySelect,
  onDismiss,
  isOpen,
}: CurrencySearchBridgeProps) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [{ listTokenIn, listTokenOut }] = useBridgeState()

  const fetchedTokens = isOutput ? listTokenOut : listTokenIn
  const tokenComparator = useTokenComparator(false)

  const isAddressSearch = isAddress(chainId, debouncedQuery)

  const filteredTokens: WrappedTokenInfo[] = useMemo(() => {
    if (isAddressSearch) {
      const find = fetchedTokens.find(e => e?.address?.toLowerCase() === debouncedQuery.toLowerCase())
      return find ? [find] : []
    }
    return filterTokens(chainId, fetchedTokens, debouncedQuery)
  }, [isAddressSearch, chainId, fetchedTokens, debouncedQuery])

  const visibleCurrencies: WrappedTokenInfo[] = useMemo(() => {
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = debouncedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol?.toLowerCase() === symbolMatch[0]),
      ...sorted.filter(token => token.symbol?.toLowerCase() !== symbolMatch[0]),
    ]
  }, [filteredTokens, debouncedQuery, tokenComparator])

  const handleCurrencySelect = useCallback(
    (currency: WrappedTokenInfo) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>(null)

  // clear the input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      inputRef.current?.focus()
    }
  }, [isOpen])

  const listTokenRef = useRef<HTMLDivElement>(null)
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const checksumInput = isAddress(chainId, input)
      setSearchQuery(checksumInput || input)
      if (listTokenRef?.current) listTokenRef.current.scrollTop = 0
    },
    [chainId],
  )

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Enter' &&
        visibleCurrencies.length > 0 &&
        (visibleCurrencies[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
          visibleCurrencies.length === 1)
      ) {
        handleCurrencySelect(visibleCurrencies[0])
      }
    },
    [visibleCurrencies, handleCurrencySelect, searchQuery],
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={20} display="flex">
            <Trans>Select a token</Trans>
            {!isOutput && (
              <InfoHelper
                zIndexTooltip={Z_INDEXS.MODAL}
                size={16}
                text={
                  <Trans>You can select and transfer any token supported by Multichain from one chain to another</Trans>
                }
              />
            )}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        {!isOutput ? (
          <SearchWrapper>
            <SearchInput
              type="text"
              id="token-search-input"
              placeholder={t`Search by token name, token symbol or address`}
              value={searchQuery}
              ref={inputRef}
              onChange={handleInput}
              onKeyDown={handleEnter}
              autoComplete="off"
            />
            <SearchIcon size={18} color={theme.border} />
          </SearchWrapper>
        ) : (
          <>
            <Text fontSize={12} color={theme.subText} lineHeight="20px">
              <Trans>
                You can select from one of the token pools below. Different pools may have different liquidity and fees
              </Trans>
            </Text>
            <Flex justifyContent="space-between" color={theme.subText} fontWeight={500} fontSize={15}>
              <Text>
                <Trans>Pool</Trans>
              </Text>
              <Text>
                <Trans>Liquidity</Trans>
              </Text>
            </Flex>
          </>
        )}
      </PaddedColumn>

      <Separator />

      {visibleCurrencies?.length ? (
        <CurrencyListBridge
          listTokenRef={listTokenRef}
          isOutput={isOutput}
          currencies={visibleCurrencies}
          onCurrencySelect={handleCurrencySelect}
        />
      ) : (
        <NoResult
          msg={
            debouncedQuery && (
              <Text fontSize={12} color={theme.subText} fontWeight="normal" lineHeight={'18px'}>
                <Trans>
                  Multichain doesn’t support this token yet. <br />
                  If you want to apply this token for cross-chain bridges on Multichain, please read more{' '}
                  <ExternalLink href="https://anyswap.medium.com/how-to-apply-for-cross-chain-bridges-on-anyswap-82fcb6c9f0d2">
                    here
                  </ExternalLink>
                </Trans>
              </Text>
            )
          }
        />
      )}
    </ContentWrapper>
  )
}

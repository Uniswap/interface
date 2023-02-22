import { Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { debounce } from 'lodash'
import { stringify } from 'querystring'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BrowserView, MobileView, isIOS, isMobile } from 'react-device-detect'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useNotify } from 'state/application/hooks'
import { filterTokens } from 'utils/filtering'

import ListPair, { Props as ListPairProps } from './ListPair'
import SearchInput from './SearchInput'
import { SuggestionPairData, reqAddFavoritePair, reqGetSuggestionPair, reqRemoveFavoritePair } from './request'
import { findLogoAndSortPair, getAddressParam, isActivePair, isFavoritePair } from './utils'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const WrapperPopup = styled(Wrapper)`
  height: 75vh;
  background-color: ${({ theme }) => theme.tabActive};
`

export const Container = styled.div`
  padding-left: 1em;
  padding-right: 1em;
  display: flex;
  flex-direction: column;
  row-gap: 1em;
`

export const MAX_FAVORITE_PAIRS = 3

type Props = {
  onSelectSuggestedPair: (fromToken: Currency | undefined, toToken: Currency | undefined, amount: string) => void
  setShowModalImportToken: (val: boolean) => void
}

export type PairSuggestionHandle = {
  onConfirmImportToken: () => void
}

export default forwardRef<PairSuggestionHandle, Props>(function PairSuggestionInput(
  { onSelectSuggestedPair, setShowModalImportToken },
  ref,
) {
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedIndex, setSelectedIndex] = useState(-1) // index selected when press up/down arrow
  const [isShowListPair, setIsShowListPair] = useState(false)

  const [suggestedPairs, setSuggestions] = useState<SuggestionPairData[]>([])
  const [favoritePairs, setListFavorite] = useState<SuggestionPairData[]>([])

  const [suggestedAmount, setSuggestedAmount] = useState<string>('')
  const [totalFavoritePair, setTotalFavoritePair] = useState(0) // to save actual total suggestedPairs because when searching, suggestedPairs being filter

  const { account, chainId } = useActiveWeb3React()
  const qs = useParsedQueryString()
  const navigate = useNavigate()
  const { mixpanelHandler } = useMixpanel()

  const refLoading = useRef(false) // prevent spam call api
  const refInput = useRef<HTMLInputElement>(null)

  const activeTokens = useAllTokens(true)

  const findToken = (search: string): NativeCurrency | Token | undefined => {
    if (search.toLowerCase() === ETHER_ADDRESS.toLowerCase()) {
      return NativeCurrencies[chainId]
    }
    return filterTokens(chainId, Object.values(activeTokens), search)[0]
  }

  const focusInput = useCallback(() => {
    const input = refInput.current
    if (!input) return
    input.focus()
    if (isIOS) input?.setSelectionRange(searchQuery.length, searchQuery.length) // fix focus input cursor at front (ios)
  }, [searchQuery])

  const refKeywordSearching = useRef('')
  const searchSuggestionPair = useCallback(
    (keyword = '') => {
      refKeywordSearching.current = keyword
      reqGetSuggestionPair(chainId, account, keyword)
        .then(({ recommendedPairs = [], favoritePairs = [], amount }) => {
          // make sure same query when typing too fast
          if (refKeywordSearching.current === keyword) {
            setSuggestions(findLogoAndSortPair(activeTokens, recommendedPairs, chainId))
            setListFavorite(findLogoAndSortPair(activeTokens, favoritePairs, chainId))
            setSuggestedAmount(amount || '')
            if (!keyword) setTotalFavoritePair(favoritePairs.length)
          }
        })
        .catch(e => {
          console.log(e)
          setSuggestions([])
          setListFavorite([])
        })
      keyword && mixpanelHandler(MIXPANEL_TYPE.TAS_TYPING_KEYWORD, keyword)
    },
    [account, chainId, mixpanelHandler, activeTokens],
  )

  const searchDebounce = useMemo(() => debounce(searchSuggestionPair, 100), [searchSuggestionPair])
  const notify = useNotify()
  const addToFavorite = (item: SuggestionPairData) => {
    focusInput()
    if (refLoading.current) return // prevent spam api
    if (totalFavoritePair === MAX_FAVORITE_PAIRS && isMobile) {
      // PC we already has tool tip
      notify({
        title: t`You can only favorite up to three token pairs.`,
        type: NotificationType.WARNING,
      })
      return
    }
    refLoading.current = true
    reqAddFavoritePair(item, account, chainId)
      .then(() => {
        searchSuggestionPair(searchQuery)
        setTotalFavoritePair(prev => prev + 1)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
    mixpanelHandler(MIXPANEL_TYPE.TAS_LIKE_PAIR, { token_1: item.tokenInSymbol, token_2: item.tokenOutSymbol })
  }

  const removeFavorite = (item: SuggestionPairData) => {
    focusInput()
    if (refLoading.current) return // prevent spam api
    refLoading.current = true
    reqRemoveFavoritePair(item, account, chainId)
      .then(() => {
        searchSuggestionPair(searchQuery)
        setTotalFavoritePair(prev => prev - 1)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
    mixpanelHandler(MIXPANEL_TYPE.TAS_DISLIKE_PAIR, { token_1: item.tokenInSymbol, token_2: item.tokenOutSymbol })
  }

  const onClickStar = (item: SuggestionPairData) => {
    if (isFavoritePair(favoritePairs, item)) {
      removeFavorite(item)
    } else {
      addToFavorite(item)
    }
  }

  const hideListView = () => {
    setIsShowListPair(false)
    setSelectedIndex(-1)
    refInput.current?.blur()
  }
  const showListView = useCallback(() => {
    setIsShowListPair(true)
    focusInput()
  }, [focusInput])

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // cmd+k or ctrl+k
        e.preventDefault()
        showListView()
        mixpanelHandler(MIXPANEL_TYPE.TAS_PRESS_CTRL_K, 'keyboard hotkey')
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [showListView, mixpanelHandler])

  useEffect(() => {
    if (isShowListPair) {
      searchDebounce(searchQuery)
    }
  }, [isShowListPair, searchQuery, searchDebounce])

  useEffect(() => {
    setSearchQuery('')
  }, [chainId])

  const onChangeInput = (value: string) => {
    setSearchQuery(value)
    searchDebounce(value)
  }

  const onSelectPair = (item: SuggestionPairData) => {
    mixpanelHandler(MIXPANEL_TYPE.TAS_SELECT_PAIR, `${item.tokenIn} to ${item.tokenOut}`)
    if (!isActivePair(activeTokens, item)) {
      // show import modal
      const newQs = {
        ...qs,
        inputCurrency: getAddressParam(item.tokenIn, chainId),
        outputCurrency: getAddressParam(item.tokenOut, chainId),
      }
      navigate({
        search: stringify(newQs),
      })
      setShowModalImportToken(true)
      refInput.current?.blur()
      return
    }
    // select pair fill input swap form
    const fromToken = findToken(item.tokenIn)
    const toToken = findToken(item.tokenOut)
    onSelectSuggestedPair(fromToken, toToken, suggestedAmount)
    hideListView()
  }

  useImperativeHandle(ref, () => ({
    onConfirmImportToken() {
      setIsShowListPair(false)
      if (suggestedAmount) {
        onSelectSuggestedPair(undefined, undefined, suggestedAmount) // fill input amount
      }
    },
  }))

  const onKeyPressInput = (e: React.KeyboardEvent) => {
    const lastIndex = suggestedPairs.length + favoritePairs.length - 1
    switch (e.key) {
      case 'ArrowDown':
        if (selectedIndex < lastIndex) {
          setSelectedIndex(prev => prev + 1)
        } else setSelectedIndex(0)
        break
      case 'ArrowUp':
        if (selectedIndex > 0) {
          setSelectedIndex(prev => prev - 1)
        } else setSelectedIndex(lastIndex)
        break
      case 'Escape':
        hideListView()
        break
      case 'Enter':
        const selectedPair = favoritePairs.concat(suggestedPairs)[selectedIndex]
        onSelectPair(selectedPair)
        break
      default:
        break
    }
  }

  const propsListPair: ListPairProps = {
    suggestedAmount,
    selectedIndex,
    isSearch: !!searchQuery,
    isShowListPair,
    suggestedPairs,
    favoritePairs,
    isFullFavoritePair: totalFavoritePair === MAX_FAVORITE_PAIRS,
    onClickStar,
    onSelectPair,
    onMouseEnterItem: (index: number) => {
      setSelectedIndex(index)
    },
  }

  const propsSearch = {
    isShowListPair,
    value: searchQuery,
    showListView,
    hideListView,
    onChangeInput,
    onKeyPressInput,
  }

  return (
    <Wrapper>
      <SearchInput ref={refInput} {...propsSearch} disabled={isMobile} />
      <BrowserView>
        <ListPair {...propsListPair} hasShadow />
      </BrowserView>
      <MobileView>
        <Modal isOpen={isShowListPair} onDismiss={hideListView} enableInitialFocusInput={true}>
          <WrapperPopup>
            <Container style={{ paddingTop: 20 }}>
              <SearchInput ref={refInput} hasBorder {...propsSearch} />
            </Container>
            <ListPair {...propsListPair} />
          </WrapperPopup>
        </Modal>
      </MobileView>
    </Wrapper>
  )
})

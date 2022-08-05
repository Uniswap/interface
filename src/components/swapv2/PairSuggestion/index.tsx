import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import styled from 'styled-components'
import { reqAddFavoritePair, reqGetSuggestionPair, reqRemoveFavoritePair, SuggestionPairData } from './request'
import { debounce } from 'lodash'
import ListPair from './ListPair'
import SearchInput from './SearchInput'
import { ChainId, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { BrowserView, isMobile, MobileView } from 'react-device-detect'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { filterTokens } from 'utils/filtering'
import { ETHER_ADDRESS } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import { stringify } from 'qs'
import { findLogoAndSortPair, getAddressParam, isActivePair, isFavoritePair } from './utils'
import { useAllTokens } from 'hooks/Tokens'
import { t } from '@lingui/macro'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { NotificationType, useNotify } from 'state/application/hooks'

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
  onSelectSuggestedPair: (
    fromToken: NativeCurrency | Token | undefined | null,
    toToken: NativeCurrency | Token | undefined | null,
    amount: string,
  ) => void
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

  const [selectedIndex, setSelectedIndex] = useState(0) // index selected when press up/down arrow
  const [isShowListPair, setIsShowListPair] = useState(false)

  const [suggestedPairs, setSuggestions] = useState<SuggestionPairData[]>([])
  const [favoritePairs, setListFavorite] = useState<SuggestionPairData[]>([])

  const [suggestedAmount, setSuggestedAmount] = useState<string>('')
  const [totalFavoritePair, setTotalFavoritePair] = useState(0) // to save actual total suggestedPairs because when searching, suggestedPairs being filter

  const { account, chainId } = useActiveWeb3React()
  const qs = useParsedQueryString()
  const history = useHistory()
  const { mixpanelHandler } = useMixpanel()

  const refLoading = useRef(false) // prevent spam call api
  const refInput = useRef<HTMLInputElement>(null)

  const activeTokens = useAllTokens(true)

  const findToken = (search: string): NativeCurrency | Token | undefined => {
    if (search.toLowerCase() === ETHER_ADDRESS.toLowerCase()) {
      return nativeOnChain(chainId as ChainId)
    }
    return filterTokens(Object.values(activeTokens), search)[0]
  }

  const focusInput = () => {
    const input = refInput.current
    if (!input) return
    input.focus()
    input?.setSelectionRange(searchQuery.length, searchQuery.length) // fix focus input cursor at front (ios)
  }

  const searchSuggestionPair = (keyword = '') => {
    reqGetSuggestionPair(chainId, account, keyword)
      .then(({ recommendedPairs = [], favoritePairs = [], amount }) => {
        setSuggestions(findLogoAndSortPair(activeTokens, recommendedPairs, chainId))
        setListFavorite(findLogoAndSortPair(activeTokens, favoritePairs, chainId))
        setSuggestedAmount(amount || '')
        if (!keyword) setTotalFavoritePair(favoritePairs.length)
      })
      .catch(e => {
        console.log(e)
        setSuggestions([])
        setListFavorite([])
      })
    keyword && mixpanelHandler(MIXPANEL_TYPE.TAS_TYPING_KEYWORD, keyword)
  }

  const searchDebounce = useCallback(debounce(searchSuggestionPair, 300), [chainId, account])
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
    mixpanelHandler(MIXPANEL_TYPE.TAS_LIKE_PAIR, { token_1: item.tokenIn, token_2: item.tokenOut })
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
    mixpanelHandler(MIXPANEL_TYPE.TAS_DISLIKE_PAIR, { token_1: item.tokenIn, token_2: item.tokenOut })
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
    setSelectedIndex(0)
    refInput.current?.blur()
  }
  const showListView = () => {
    setIsShowListPair(true)
    focusInput()
  }

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
  }, [mixpanelHandler])

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
      history.push({
        search: stringify(newQs),
      })
      setShowModalImportToken(true)
      return
    }
    // select pair fill input swap form
    const fromToken = findToken(item.tokenIn)
    const toToken = findToken(item.tokenOut)
    onSelectSuggestedPair(fromToken, toToken, suggestedAmount)
    setIsShowListPair(false)
  }

  useImperativeHandle(ref, () => ({
    onConfirmImportToken() {
      setIsShowListPair(false)
      if (suggestedAmount) {
        onSelectSuggestedPair(null, null, suggestedAmount) // fill input amount
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

  const propsListPair = {
    suggestedAmount,
    selectedIndex,
    isSearch: !!searchQuery,
    isShowListPair,
    suggestedPairs,
    favoritePairs,
    isFullFavoritePair: totalFavoritePair === MAX_FAVORITE_PAIRS,
    onClickStar,
    onSelectPair,
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

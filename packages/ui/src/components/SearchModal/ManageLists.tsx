import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Settings, CheckCircle } from 'react-feather'
import ReactGA from 'react-ga'
import { usePopper } from 'react-popper'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { TokenList } from '@uniswap/token-lists'

import useToggle from '../../hooks/useToggle'
import { AppDispatch, AppState } from '../../state'
import { acceptListUpdate, removeList, disableList, enableList } from '../../state/lists/actions'
import { useIsListActive, useAllLists, useActiveListUrls } from '../../state/lists/hooks'
import { ExternalLink, LinkStyledButton, TYPE, IconWrapper } from '../../theme'
import listVersionLabel from '../../utils/listVersionLabel'
import { parseENSAddress } from '../../utils/parseENSAddress'
import uriToHttp from '../../utils/uriToHttp'
import { ButtonEmpty, ButtonPrimary } from '../Button'

import Column, { AutoColumn } from '../Column'
import ListLogo from '../ListLogo'
import Row, { RowFixed, RowBetween } from '../Row'
import { PaddedColumn, SearchInput, Separator, SeparatorDark } from './styleds'
import { useListColor } from 'hooks/useColor'
import useTheme from '../../hooks/useTheme'
import ListToggle from '../Toggle/ListToggle'
import Card from 'components/Card'
import { CurrencyModalView } from './CurrencySearchModal'
import { UNSUPPORTED_LIST_URLS } from 'constants/lists'

const Wrapper = styled(Column)`
  width: 100%;
  height: 100%;
`

const UnpaddedLinkStyledButton = styled(LinkStyledButton)`
  padding: 0;
  font-size: 1rem;
  opacity: ${({ disabled }) => (disabled ? '0.4' : '1')};
`

const PopoverContainer = styled.div<{ show: boolean }>`
  z-index: 100;
  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  opacity: ${props => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;
  background: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  color: ${({ theme }) => theme.text2};
  border-radius: 0.5rem;
  padding: 1rem;
  display: grid;
  grid-template-rows: 1fr;
  grid-gap: 8px;
  font-size: 1rem;
  text-align: left;
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
`

const StyledTitleText = styled.div<{ active: boolean }>`
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: ${({ theme, active }) => (active ? theme.white : theme.text2)};
`

const StyledListUrlText = styled(TYPE.main)<{ active: boolean }>`
  font-size: 12px;
  color: ${({ theme, active }) => (active ? theme.white : theme.text2)};
`

const RowWrapper = styled(Row)<{ bgColor: string; active: boolean }>`
  background-color: ${({ bgColor, active, theme }) => (active ? bgColor ?? 'transparent' : theme.bg2)};
  transition: 200ms;
  align-items: center;
  padding: 1rem;
  border-radius: 20px;
`

function listUrlRowHTMLId(listUrl: string) {
  return `list-row-${listUrl.replace(/\./g, '-')}`
}

const ListRow = memo(function ListRow({ listUrl }: { listUrl: string }) {
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const dispatch = useDispatch<AppDispatch>()
  const { current: list, pendingUpdate: pending } = listsByUrl[listUrl]

  const theme = useTheme()
  const listColor = useListColor(list?.logoURI)
  const isActive = useIsListActive(listUrl)

  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement>()
  const [popperElement, setPopperElement] = useState<HTMLDivElement>()

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [8, 8] } }]
  })

  useOnClickOutside(node, open ? toggle : undefined)

  const handleAcceptListUpdate = useCallback(() => {
    if (!pending) return
    ReactGA.event({
      category: 'Lists',
      action: 'Update List from List Select',
      label: listUrl
    })
    dispatch(acceptListUpdate(listUrl))
  }, [dispatch, listUrl, pending])

  const handleRemoveList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Start Remove List',
      label: listUrl
    })
    if (window.prompt(`Please confirm you would like to remove this list by typing REMOVE`) === `REMOVE`) {
      ReactGA.event({
        category: 'Lists',
        action: 'Confirm Remove List',
        label: listUrl
      })
      dispatch(removeList(listUrl))
    }
  }, [dispatch, listUrl])

  const handleEnableList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Enable List',
      label: listUrl
    })
    dispatch(enableList(listUrl))
  }, [dispatch, listUrl])

  const handleDisableList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Disable List',
      label: listUrl
    })
    dispatch(disableList(listUrl))
  }, [dispatch, listUrl])

  if (!list) return null

  return (
    <RowWrapper active={isActive} bgColor={listColor} key={listUrl} id={listUrlRowHTMLId(listUrl)}>
      {list.logoURI ? (
        <ListLogo size="40px" style={{ marginRight: '1rem' }} logoURI={list.logoURI} alt={`${list.name} list logo`} />
      ) : (
        <div style={{ width: '24px', height: '24px', marginRight: '1rem' }} />
      )}
      <Column style={{ flex: '1' }}>
        <Row>
          <StyledTitleText active={isActive}>{list.name}</StyledTitleText>
        </Row>
        <RowFixed mt="4px">
          <StyledListUrlText active={isActive} mr="6px">
            {list.tokens.length} tokens
          </StyledListUrlText>
          <StyledMenu ref={node as any}>
            <ButtonEmpty onClick={toggle} ref={setReferenceElement} padding="0">
              <Settings stroke={isActive ? theme.bg1 : theme.text1} size={12} />
            </ButtonEmpty>
            {open && (
              <PopoverContainer show={true} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
                <div>{list && listVersionLabel(list.version)}</div>
                <SeparatorDark />
                <ExternalLink href={`https://tokenlists.org/token-list?url=${listUrl}`}>View list</ExternalLink>
                <UnpaddedLinkStyledButton onClick={handleRemoveList} disabled={Object.keys(listsByUrl).length === 1}>
                  Remove list
                </UnpaddedLinkStyledButton>
                {pending && (
                  <UnpaddedLinkStyledButton onClick={handleAcceptListUpdate}>Update list</UnpaddedLinkStyledButton>
                )}
              </PopoverContainer>
            )}
          </StyledMenu>
        </RowFixed>
      </Column>
      <ListToggle
        isActive={isActive}
        bgColor={listColor}
        toggle={() => {
          isActive ? handleDisableList() : handleEnableList()
        }}
      />
    </RowWrapper>
  )
})

const ListContainer = styled.div`
  padding: 1rem;
  height: 100%;
  overflow: auto;
  padding-bottom: 80px;
`

export function ManageLists({
  setModalView,
  setImportList,
  setListUrl
}: {
  setModalView: (view: CurrencyModalView) => void
  setImportList: (list: TokenList) => void
  setListUrl: (url: string) => void
}) {
  const theme = useTheme()

  const [listUrlInput, setListUrlInput] = useState<string>('')

  const lists = useAllLists()

  // sort by active but only if not visible
  const activeListUrls = useActiveListUrls()
  const [activeCopy, setActiveCopy] = useState<string[] | undefined>()
  useEffect(() => {
    if (!activeCopy && activeListUrls) {
      setActiveCopy(activeListUrls)
    }
  }, [activeCopy, activeListUrls])

  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
  }, [])

  const fetchList = useFetchListCallback()

  const validUrl: boolean = useMemo(() => {
    return uriToHttp(listUrlInput).length > 0 || Boolean(parseENSAddress(listUrlInput))
  }, [listUrlInput])

  const sortedLists = useMemo(() => {
    const listUrls = Object.keys(lists)
    return listUrls
      .filter(listUrl => {
        // only show loaded lists, hide unsupported lists
        return Boolean(lists[listUrl].current) && !Boolean(UNSUPPORTED_LIST_URLS.includes(listUrl))
      })
      .sort((u1, u2) => {
        const { current: l1 } = lists[u1]
        const { current: l2 } = lists[u2]

        // first filter on active lists
        if (activeCopy?.includes(u1) && !activeCopy?.includes(u2)) {
          return -1
        }
        if (!activeCopy?.includes(u1) && activeCopy?.includes(u2)) {
          return 1
        }

        if (l1 && l2) {
          return l1.name.toLowerCase() < l2.name.toLowerCase()
            ? -1
            : l1.name.toLowerCase() === l2.name.toLowerCase()
            ? 0
            : 1
        }
        if (l1) return -1
        if (l2) return 1
        return 0
      })
  }, [lists, activeCopy])

  // temporary fetched list for import flow
  const [tempList, setTempList] = useState<TokenList>()
  const [addError, setAddError] = useState<string | undefined>()

  useEffect(() => {
    async function fetchTempList() {
      fetchList(listUrlInput, false)
        .then(list => setTempList(list))
        .catch(() => setAddError('Error importing list'))
    }
    // if valid url, fetch details for card
    if (validUrl) {
      fetchTempList()
    } else {
      setTempList(undefined)
      listUrlInput !== '' && setAddError('Enter valid list location')
    }

    // reset error
    if (listUrlInput === '') {
      setAddError(undefined)
    }
  }, [fetchList, listUrlInput, validUrl])

  // check if list is already imported
  const isImported = Object.keys(lists).includes(listUrlInput)

  // set list values and have parent modal switch to import list view
  const handleImport = useCallback(() => {
    if (!tempList) return
    setImportList(tempList)
    setModalView(CurrencyModalView.importList)
    setListUrl(listUrlInput)
  }, [listUrlInput, setImportList, setListUrl, setModalView, tempList])

  return (
    <Wrapper>
      <PaddedColumn gap="14px">
        <Row>
          <SearchInput
            type="text"
            id="list-add-input"
            placeholder="https:// or ipfs:// or ENS name"
            value={listUrlInput}
            onChange={handleInput}
          />
        </Row>
        {addError ? (
          <TYPE.error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
            {addError}
          </TYPE.error>
        ) : null}
      </PaddedColumn>
      {tempList && (
        <PaddedColumn style={{ paddingTop: 0 }}>
          <Card backgroundColor={theme.bg2} padding="12px 20px">
            <RowBetween>
              <RowFixed>
                {tempList.logoURI && <ListLogo logoURI={tempList.logoURI} size="40px" />}
                <AutoColumn gap="4px" style={{ marginLeft: '20px' }}>
                  <TYPE.body fontWeight={600}>{tempList.name}</TYPE.body>
                  <TYPE.main fontSize={'12px'}>{tempList.tokens.length} tokens</TYPE.main>
                </AutoColumn>
              </RowFixed>
              {isImported ? (
                <RowFixed>
                  <IconWrapper stroke={theme.text2} size="16px" marginRight={'10px'}>
                    <CheckCircle />
                  </IconWrapper>
                  <TYPE.body color={theme.text2}>Loaded</TYPE.body>
                </RowFixed>
              ) : (
                <ButtonPrimary
                  style={{ fontSize: '14px' }}
                  padding="6px 8px"
                  width="fit-content"
                  onClick={handleImport}
                >
                  Import
                </ButtonPrimary>
              )}
            </RowBetween>
          </Card>
        </PaddedColumn>
      )}
      <Separator />
      <ListContainer>
        <AutoColumn gap="md">
          {sortedLists.map(listUrl => (
            <ListRow key={listUrl} listUrl={listUrl} />
          ))}
        </AutoColumn>
      </ListContainer>
    </Wrapper>
  )
}

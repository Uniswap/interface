import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import styled from 'styled-components'
import useENSContentHash from '../../hooks/useENSContentHash'
import { AppDispatch, AppState } from '../../state'
import { acceptListUpdate, addList, removeList, selectList } from '../../state/lists/actions'
import { useSelectedListUrl } from '../../state/lists/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'
import getTokenList from '../../utils/getTokenList'
import listVersionLabel from '../../utils/listVersionLabel'
import { parseENSAddress } from '../../utils/parseENSAddress'
import uriToHttp from '../../utils/uriToHttp'
import { ButtonSecondary } from '../Button'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import Row, { RowBetween } from '../Row'
import { PaddedColumn, SearchInput, Separator } from './styleds'

const UnpaddedLinkStyledButton = styled(LinkStyledButton)`
  padding: 0;
`

function ListRow({ listUrl }: { listUrl: string }) {
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const selectedListUrl = useSelectedListUrl()
  const dispatch = useDispatch<AppDispatch>()
  const { current: list, pendingUpdate: pending } = listsByUrl[listUrl]
  if (!list) return null

  const isSelected = listUrl === selectedListUrl

  return (
    <Row key={listUrl} align="center">
      <div style={{ marginRight: '1rem', flex: '0' }}>
        <input
          type="radio"
          value={listUrl}
          checked={isSelected}
          onChange={e => {
            if (e.target.checked) {
              ReactGA.event({
                category: 'Lists',
                action: 'Select List',
                label: listUrl
              })

              dispatch(selectList(listUrl))
            }
          }}
        />
      </div>
      <Column style={{ flex: '1' }}>
        <Text
          fontWeight={isSelected ? 500 : 400}
          fontSize={16}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={listUrl}
        >
          {list?.name ?? listUrl}
        </Text>
        <RowBetween>
          <div>
            <UnpaddedLinkStyledButton
              onClick={() => {
                ReactGA.event({
                  category: 'Lists',
                  action: 'Start Remove List',
                  label: listUrl
                })
                if (
                  window.prompt(`Please confirm you would like to remove this list by typing its URL:\n${listUrl}`) ===
                  listUrl
                ) {
                  ReactGA.event({
                    category: 'Lists',
                    action: 'Confirm Remove List',
                    label: listUrl
                  })
                  dispatch(removeList(listUrl))
                }
              }}
              disabled={Object.keys(listsByUrl).length === 1}
            >
              Remove
            </UnpaddedLinkStyledButton>
          </div>
          {pending ? (
            <UnpaddedLinkStyledButton
              onClick={() => {
                ReactGA.event({
                  category: 'Lists',
                  action: 'Update List from List Select',
                  label: listUrl
                })
                dispatch(acceptListUpdate(listUrl))
              }}
            >
              Update to {listVersionLabel(pending.version)}
            </UnpaddedLinkStyledButton>
          ) : (
            <div>{list && listVersionLabel(list.version)}</div>
          )}
        </RowBetween>
      </Column>
    </Row>
  )
}

const AddListButton = styled(ButtonSecondary)`
  height: 1.8rem;
  max-width: 4rem;
  margin-left: 1rem;
  border-radius: 6px;
  padding: 16px 18px;
`

const ListContainer = styled(PaddedColumn)`
  margin-bottom: 14px;
  flex: 1;
  overflow: auto;
`

export function ListSelect({ onDismiss, onBack }: { onDismiss: () => void; onBack: () => void }) {
  const [listUrlInput, setListUrlInput] = useState<string>('')
  const [{ addError }, setAddState] = useState<{ adding: boolean; addError: string | null }>({
    adding: false,
    addError: null
  })
  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
  }, [])
  const dispatch = useDispatch<AppDispatch>()

  const parsedENS = useMemo(() => parseENSAddress(listUrlInput), [listUrlInput])
  const contenthash = useENSContentHash(parsedENS?.ensName)
  const isLoadingContentHash = Boolean(parsedENS && contenthash.loading)
  const resolveENSContentHash = useCallback(async () => {
    if (isLoadingContentHash) throw new Error('Loading')
    if (!parsedENS || !contenthash.contenthash) throw new Error('Invalid ENS name')
    return contenthash.contenthash
  }, [contenthash.contenthash, isLoadingContentHash, parsedENS])

  const handleAddList = useCallback(() => {
    setAddState({ adding: true, addError: null })
    getTokenList(listUrlInput, resolveENSContentHash)
      .then(() => {
        dispatch(addList(listUrlInput))
        ReactGA.event({
          category: 'Lists',
          action: 'Add List',
          label: listUrlInput
        })
      })
      .then(() => {
        setAddState({ adding: false, addError: null })
        setListUrlInput('')
      })
      .catch(error => {
        setAddState({ adding: false, addError: error.message })
        ReactGA.event({
          category: 'Lists',
          action: 'Add List Failed',
          label: listUrlInput
        })
      })
  }, [dispatch, listUrlInput, resolveENSContentHash])

  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  const validUrl: boolean = useMemo(() => {
    return uriToHttp(listUrlInput).length > 0 || Boolean(parseENSAddress(listUrlInput))
  }, [listUrlInput])

  const handleEnterKey = useCallback(
    e => {
      if (validUrl && e.key === 'Enter') {
        handleAddList()
      }
    },
    [handleAddList, validUrl]
  )

  const sortedLists = useMemo(() => {
    const listUrls = Object.keys(lists)
    return listUrls.sort((u1, u2) => {
      const { current: l1 } = lists[u1]
      const { current: l2 } = lists[u2]
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
  }, [lists])

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn>
        <RowBetween>
          <div>
            <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
          </div>
          <Text fontWeight={500} fontSize={20}>
            Manage Lists
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <PaddedColumn gap="14px">
        <Text fontWeight={600}>
          Add a list{' '}
          <QuestionHelper text="Token lists are an open specification for lists of ERC20 tokens. You can use any token list by entering its URL below. Note that third party token lists can contain fake or malicious ERC20 tokens." />
        </Text>
        <Row>
          <SearchInput
            type="text"
            id="list-add-input"
            placeholder="https:// or ipfs://"
            value={listUrlInput}
            onChange={handleInput}
            onKeyDown={handleEnterKey}
            style={{ height: '1.8rem', borderRadius: 6 }}
          />
          <AddListButton onClick={handleAddList} disabled={!validUrl || isLoadingContentHash}>
            Add
          </AddListButton>
        </Row>
        {addError ? (
          <TYPE.error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
            {addError}
          </TYPE.error>
        ) : null}
      </PaddedColumn>

      <Separator />

      <ListContainer gap="14px">
        {sortedLists.map(listUrl => (
          <ListRow key={listUrl} listUrl={listUrl} />
        ))}
      </ListContainer>
    </Column>
  )
}

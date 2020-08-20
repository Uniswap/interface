import React, { memo, useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import { AppDispatch, AppState } from '../../state'
import { acceptListUpdate, removeList, selectList } from '../../state/lists/actions'
import { useSelectedListUrl } from '../../state/lists/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'
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

const ListRow = memo(function ListRow({ listUrl }: { listUrl: string }) {
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const selectedListUrl = useSelectedListUrl()
  const dispatch = useDispatch<AppDispatch>()
  const { current: list, pendingUpdate: pending } = listsByUrl[listUrl]

  const isSelected = listUrl === selectedListUrl

  const selectThisList = useCallback(() => {
    if (isSelected) return
    ReactGA.event({
      category: 'Lists',
      action: 'Select List',
      label: listUrl
    })

    dispatch(selectList(listUrl))
  }, [dispatch, isSelected, listUrl])

  if (!list) return null

  return (
    <Row key={listUrl} align="center">
      <div style={{ marginRight: '1rem', flex: '0' }}>
        <input
          type="radio"
          value={listUrl}
          checked={isSelected}
          onChange={e => {
            if (e.target.checked) {
              selectThisList()
            }
          }}
        />
      </div>
      <Column style={{ flex: '1' }}>
        <Text
          fontWeight={isSelected ? 500 : 400}
          fontSize={16}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
          onClick={selectThisList}
          title={listUrl}
        >
          {list.name}
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
})

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

  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const adding = Boolean(lists[listUrlInput]?.loadingRequestId)
  const addError = lists[listUrlInput]?.error

  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
  }, [])
  const fetchList = useFetchListCallback()

  const handleAddList = useCallback(() => {
    if (adding) return
    fetchList(listUrlInput)
      .then(() => {
        setListUrlInput('')
        ReactGA.event({
          category: 'Lists',
          action: 'Add List',
          label: listUrlInput
        })
      })
      .catch(() => {
        ReactGA.event({
          category: 'Lists',
          action: 'Add List Failed',
          label: listUrlInput
        })
        dispatch(removeList(listUrlInput))
      })
  }, [adding, dispatch, fetchList, listUrlInput])

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
    return listUrls
      .filter(listUrl => {
        return Boolean(lists[listUrl].current)
      })
      .sort((u1, u2) => {
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
          <QuestionHelper text="Token lists are an open specification for lists of ERC20 tokens. You can use any token list by entering its URL below. Beware that third party token lists can contain fake or malicious ERC20 tokens." />
        </Text>
        <Row>
          <SearchInput
            type="text"
            id="list-add-input"
            placeholder="https:// or ipfs:// or ENS name"
            value={listUrlInput}
            onChange={handleInput}
            onKeyDown={handleEnterKey}
            style={{ height: '1.8rem', borderRadius: 6 }}
          />
          <AddListButton onClick={handleAddList} disabled={!validUrl}>
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

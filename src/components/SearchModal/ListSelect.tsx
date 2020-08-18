import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import { AppDispatch, AppState } from '../../state'
import { addList, removeList, selectList } from '../../state/lists/actions'
import { useSelectedListUrl } from '../../state/lists/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'
import getTokenList from '../../utils/getTokenList'
import listVersionLabel from '../../utils/listVersionLabel'
import { parseENSAddress } from '../../utils/parseENSAddress'
import resolveENSContentHash from '../../utils/resolveENSContentHash'
import uriToHttp from '../../utils/uriToHttp'
import { ButtonPrimary } from '../Button'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import { PaddedColumn, SearchInput, Separator } from './styleds'

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

  const handleAddList = useCallback(() => {
    setAddState({ adding: true, addError: null })
    getTokenList(listUrlInput, resolveENSContentHash)
      .then(() => {
        dispatch(addList(listUrlInput))
      })
      .then(() => {
        setAddState({ adding: false, addError: null })
        setListUrlInput('')
      })
      .catch(error => {
        setAddState({ adding: false, addError: error.message })
      })
  }, [dispatch, listUrlInput])

  const selectedListUrl = useSelectedListUrl()
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
        <Row>
          <Text fontWeight={600}>Add a list</Text>
        </Row>
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
          <ButtonPrimary
            style={{ height: '1.8rem', maxWidth: '4rem', marginLeft: '1rem', borderRadius: 6, padding: '16px 18px' }}
            onClick={handleAddList}
            disabled={!validUrl}
          >
            Add
          </ButtonPrimary>
        </Row>
        {addError ? (
          <TYPE.error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
            {addError}
          </TYPE.error>
        ) : null}
      </PaddedColumn>

      <Separator />

      <PaddedColumn gap="14px">
        {Object.keys(lists).map((listUrl, ix, allListUrls) => {
          const { current: list } = lists[listUrl]
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
                    if (e.target.checked) dispatch(selectList(listUrl))
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
                    <LinkStyledButton
                      style={{ padding: 0 }}
                      onClick={() => {
                        if (
                          window.prompt(
                            `Please confirm you would like to remove this list by typing its URL:\n${listUrl}`
                          ) === listUrl
                        ) {
                          dispatch(removeList(listUrl))
                        }
                      }}
                      disabled={allListUrls.length === 1}
                    >
                      Remove
                    </LinkStyledButton>
                  </div>
                  <div>{list && listVersionLabel(list.version)}</div>
                </RowBetween>
              </Column>
            </Row>
          )
        })}
      </PaddedColumn>
    </Column>
  )
}

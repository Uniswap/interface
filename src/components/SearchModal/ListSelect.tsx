import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { DEFAULT_TOKEN_LIST_URL } from '../../constants'
import { AppDispatch, AppState } from '../../state'
import { addList, removeList, selectList } from '../../state/lists/actions'
import { useSelectedListUrl } from '../../state/lists/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'
import { getTokenList } from '../../utils/getTokenList'
import listVersionLabel from '../../utils/listVersionLabel'
import uriToHttp from '../../utils/uriToHttp'
import { ButtonPrimary, ButtonSecondary } from '../Button'
import Card from '../Card'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import Row, { AutoRow, RowBetween } from '../Row'
import { PaddedColumn, SearchInput, Separator } from './styleds'

export function ListSelect({ onDismiss, onBack }: { onDismiss: () => void; onBack: () => void }) {
  const theme = useContext(ThemeContext)
  const [listUrlInput, setListUrlInput] = useState<string>('')
  const [addError, setAddError] = useState<string | null>(null)
  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
  }, [])
  const dispatch = useDispatch<AppDispatch>()

  const handleAddList = useCallback(() => {
    setAddError(null)
    getTokenList(listUrlInput)
      .then(() => {
        dispatch(addList(listUrlInput))
      })
      .then(() => {
        setListUrlInput('')
      })
      .catch(error => {
        setAddError(error.message)
      })
  }, [dispatch, listUrlInput])

  const selectedListUrl = useSelectedListUrl()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  const validUrl: boolean = useMemo(() => {
    return uriToHttp(listUrlInput).length > 0
  }, [listUrlInput])

  const handleEnterKey = useCallback(
    e => {
      if (e.key === 'Enter') {
        handleAddList()
      }
    },
    [handleAddList]
  )

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a list
            <QuestionHelper text="Select a token list to change the list of tokens that you use in the Uniswap Interface." />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Row>
          <SearchInput
            type="text"
            id="list-add-input"
            placeholder="ipfs:// or https://"
            value={listUrlInput}
            onChange={handleInput}
            onKeyDown={handleEnterKey}
          />
          <ButtonPrimary style={{ maxWidth: '4rem', marginLeft: '1rem' }} onClick={handleAddList} disabled={!validUrl}>
            Add
          </ButtonPrimary>
        </Row>
        {addError ? <TYPE.error error>{addError}</TYPE.error> : null}
      </PaddedColumn>

      <Separator />

      <div style={{ flex: '1', padding: '1rem' }}>
        {Object.keys(lists).map(listUrl => {
          const { current: list } = lists[listUrl]

          const isSelected = listUrl === selectedListUrl

          return (
            <div key={listUrl}>
              <div title={listUrl}>{list?.name ?? listUrl}</div>
              <div>{list?.version && listVersionLabel(list?.version)}</div>
              <Row>
                <ButtonSecondary
                  onClick={() => {
                    !isSelected && dispatch(selectList(listUrl))
                  }}
                  disabled={isSelected}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </ButtonSecondary>
                <ButtonSecondary
                  onClick={() => {
                    dispatch(removeList(listUrl))
                  }}
                  disabled={listUrl === DEFAULT_TOKEN_LIST_URL}
                >
                  Remove
                </ButtonSecondary>
              </Row>
            </div>
          )
        })}
      </div>

      <Separator />

      <Card>
        <AutoRow justify={'space-between'}>
          <LinkStyledButton style={{ fontWeight: 500, color: theme.text2, fontSize: 16 }} onClick={onBack}>
            Back
          </LinkStyledButton>
        </AutoRow>
      </Card>
    </Column>
  )
}

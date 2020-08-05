import React, { useCallback, useContext, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AppDispatch, AppState } from '../../state'
import { addList } from '../../state/lists/actions'
import { CloseIcon, LinkStyledButton } from '../../theme'
import listVersionLabel from '../../utils/listVersionLabel'
import { ButtonPrimary } from '../Button'
import Card from '../Card'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import Row, { AutoRow, RowBetween } from '../Row'
import { PaddedColumn, SearchInput, Separator } from './styleds'

export function ListSelect({ onDismiss, onBack }: { onDismiss: () => void; onBack: () => void }) {
  const theme = useContext(ThemeContext)
  const [listUrlInput, setListUrlInput] = useState<string>('')
  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
  }, [])
  const dispatch = useDispatch<AppDispatch>()

  const handleAddList = useCallback(() => {
    dispatch(addList(listUrlInput))
  }, [dispatch, listUrlInput])

  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

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
            onKeyDown={handleAddList}
          />
          <ButtonPrimary style={{ maxWidth: '4rem', marginLeft: '1rem' }} onClick={handleAddList}>
            Add
          </ButtonPrimary>
        </Row>
      </PaddedColumn>

      <Separator />

      <div style={{ flex: '1', padding: '1rem' }}>
        {Object.keys(lists).map(listUrl => {
          const { current: list } = lists[listUrl]

          return (
            <div key={listUrl}>
              <div title={listUrl}>{list?.name}</div>
              <div>{list?.version && listVersionLabel(list?.version)}</div>
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

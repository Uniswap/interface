import React, { useCallback, useContext } from 'react'
import { AlertCircle, Info } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { ThemeContext } from 'styled-components'

import { AppDispatch, AppState } from '../../state'
import { useRemovePopup } from '../../state/application/hooks'
import { acceptListUpdate } from '../../state/lists/actions'
import { LinkStyledButton, TYPE } from '../../theme'

import { ExternalLink } from '../../theme/components'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

export default function ListUpdatePopup({ popKey, listUrl, auto }: { popKey: string; listUrl: string; auto: boolean }) {
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])
  const dispatch = useDispatch<AppDispatch>()
  const theme = useContext(ThemeContext)

  const allLists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const listState = allLists[listUrl]
  const name = listState?.current?.name
  const version = listState?.current?.version
  const newVersion = listState?.current?.version

  const updateList = useCallback(() => {
    dispatch(acceptListUpdate(listUrl))
    removeThisPopup()
  }, [dispatch, listUrl, removeThisPopup])

  return (
    <AutoRow>
      <div style={{ paddingRight: 16 }}>
        {auto ? <Info color={theme.text2} size={24} /> : <AlertCircle color={theme.red1} size={24} />}
      </div>
      <AutoColumn gap="8px">
        <TYPE.body fontWeight={500}>
          {auto ? (
            `The token list "${name}" has been updated from version ${version?.major}.${version?.minor}.${version?.patch} to ${newVersion?.major}.${newVersion?.minor}.${newVersion?.patch}.`
          ) : (
            <span>
              A token list update is available for the list &quot;{name}&quot;. Click{' '}
              <LinkStyledButton onClick={updateList}>here</LinkStyledButton> to update.
            </span>
          )}
        </TYPE.body>
        <ExternalLink href={listUrl}>View list</ExternalLink>
      </AutoColumn>
    </AutoRow>
  )
}

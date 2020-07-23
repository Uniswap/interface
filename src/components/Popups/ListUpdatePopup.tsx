import { TokenList, Version } from '@uniswap/token-lists'
import React, { useCallback, useContext } from 'react'
import { AlertCircle, Info } from 'react-feather'
import { useDispatch } from 'react-redux'
import { ThemeContext } from 'styled-components'
import { AppDispatch } from '../../state'
import { useRemovePopup } from '../../state/application/hooks'
import { acceptListUpdate } from '../../state/lists/actions'
import { TYPE } from '../../theme'
import { ButtonPrimary, ButtonSecondary } from '../Button'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

function versionLabel(version: Version): string {
  return `v${version.major}.${version.minor}.${version.patch}`
}

export default function ListUpdatePopup({
  popKey,
  listUrl,
  oldList,
  newList,
  auto
}: {
  popKey: string
  listUrl: string
  oldList: TokenList
  newList: TokenList
  auto: boolean
}) {
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])
  const dispatch = useDispatch<AppDispatch>()
  const theme = useContext(ThemeContext)

  const updateList = useCallback(() => {
    if (auto) return
    dispatch(acceptListUpdate(listUrl))
    removeThisPopup()
  }, [auto, dispatch, listUrl, removeThisPopup])

  return (
    <AutoRow>
      <div style={{ paddingRight: 16 }}>
        {auto ? <Info color={theme.text2} size={24} /> : <AlertCircle color={theme.red1} size={24} />}{' '}
      </div>
      <AutoColumn style={{ flex: '1' }} gap="8px">
        {auto ? (
          <TYPE.body fontWeight={500}>
            The token list &quot;{oldList.name}&quot; has been updated to{' '}
            <strong>{versionLabel(newList.version)}</strong>.
          </TYPE.body>
        ) : (
          <>
            <div>
              A token list update is available for the list &quot;{oldList.name}&quot; ({versionLabel(oldList.version)}{' '}
              to {versionLabel(newList.version)}).
            </div>
            <AutoRow>
              <div style={{ flexGrow: 1, marginRight: 6 }}>
                <ButtonPrimary onClick={updateList}>Update list</ButtonPrimary>
              </div>
              <div style={{ flexGrow: 1 }}>
                <ButtonSecondary onClick={removeThisPopup}>Dismiss</ButtonSecondary>
              </div>
            </AutoRow>
          </>
        )}
      </AutoColumn>
    </AutoRow>
  )
}

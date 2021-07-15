import { diffTokenLists, TokenList } from '@uniswap/token-lists'
import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

import { AppDispatch } from '../../state'
import { useRemovePopup } from '../../state/application/hooks'
import { acceptListUpdate } from '../../state/lists/actions'
import { TYPE } from '../../theme'
import listVersionLabel from '../../utils/listVersionLabel'
import { ButtonSecondary } from '../Button'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

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

  const handleAcceptUpdate = useCallback(() => {
    if (auto) return

    dispatch(acceptListUpdate(listUrl))
    removeThisPopup()
  }, [auto, dispatch, listUrl, removeThisPopup])

  const { added: tokensAdded, changed: tokensChanged, removed: tokensRemoved } = useMemo(() => {
    return diffTokenLists(oldList.tokens, newList.tokens)
  }, [newList.tokens, oldList.tokens])
  const numTokensChanged = useMemo(
    () =>
      Object.keys(tokensChanged).reduce((memo, chainId: any) => memo + Object.keys(tokensChanged[chainId]).length, 0),
    [tokensChanged]
  )

  return (
    <AutoRow>
      <AutoColumn style={{ flex: '1' }} gap="8px">
        {auto ? (
          <TYPE.body fontWeight={500}>
            <Trans>
              The token list &quot;{oldList.name}&quot; has been updated to{' '}
              <strong>{listVersionLabel(newList.version)}</strong>.
            </Trans>
          </TYPE.body>
        ) : (
          <>
            <div>
              <Text>
                <Trans>
                  An update is available for the token list &quot;{oldList.name}&quot; (
                  {listVersionLabel(oldList.version)} to {listVersionLabel(newList.version)}).
                </Trans>
              </Text>
              <ul>
                {tokensAdded.length > 0 ? (
                  <li>
                    <Trans>
                      {tokensAdded.map((token, i) => (
                        <React.Fragment key={`${token.chainId}-${token.address}`}>
                          <strong title={token.address}>{token.symbol}</strong>
                          {i === tokensAdded.length - 1 ? null : ', '}
                        </React.Fragment>
                      ))}{' '}
                      added
                    </Trans>
                  </li>
                ) : null}
                {tokensRemoved.length > 0 ? (
                  <li>
                    <Trans>
                      {tokensRemoved.map((token, i) => (
                        <React.Fragment key={`${token.chainId}-${token.address}`}>
                          <strong title={token.address}>{token.symbol}</strong>
                          {i === tokensRemoved.length - 1 ? null : ', '}
                        </React.Fragment>
                      ))}{' '}
                      removed
                    </Trans>
                  </li>
                ) : null}
                {numTokensChanged > 0 ? (
                  <li>
                    <Trans>{numTokensChanged} tokens updated</Trans>
                  </li>
                ) : null}
              </ul>
            </div>
            <AutoRow>
              <div style={{ flexGrow: 1, marginRight: 12 }}>
                <ButtonSecondary onClick={handleAcceptUpdate}>
                  <Trans>Accept update</Trans>
                </ButtonSecondary>
              </div>
              <div style={{ flexGrow: 1 }}>
                <ButtonSecondary onClick={removeThisPopup}>
                  <Trans>Dismiss</Trans>
                </ButtonSecondary>
              </div>
            </AutoRow>
          </>
        )}
      </AutoColumn>
    </AutoRow>
  )
}

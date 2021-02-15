import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import ReactGA from 'react-ga'
import { TYPE, CloseIcon } from 'theme'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed, AutoRow } from 'components/Row'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { transparentize } from 'polished'
import { ButtonPrimary } from 'components/Button'
import { SectionBreak } from 'components/swap/styleds'
import { ExternalLink } from '../../theme/components'
import ListLogo from 'components/ListLogo'
import { PaddedColumn, Checkbox, TextDot } from './styleds'
import { TokenList } from '@uniswap/token-lists'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'state'
import { useFetchListCallback } from 'hooks/useFetchListCallback'
import { removeList, enableList } from 'state/lists/actions'
import { CurrencyModalView } from './CurrencySearchModal'
import { useAllLists } from 'state/lists/hooks'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
`

interface ImportProps {
  listURL: string
  list: TokenList
  onDismiss: () => void
  setModalView: (view: CurrencyModalView) => void
}

export function ImportList({ listURL, list, setModalView, onDismiss }: ImportProps) {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()

  // user must accept
  const [confirmed, setConfirmed] = useState(false)

  const lists = useAllLists()
  const fetchList = useFetchListCallback()

  // monitor is list is loading
  const adding = Boolean(lists[listURL]?.loadingRequestId)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAddList = useCallback(() => {
    if (adding) return
    setAddError(null)
    fetchList(listURL)
      .then(() => {
        ReactGA.event({
          category: 'Lists',
          action: 'Add List',
          label: listURL,
        })

        // turn list on
        dispatch(enableList(listURL))
        // go back to lists
        setModalView(CurrencyModalView.manage)
      })
      .catch((error) => {
        ReactGA.event({
          category: 'Lists',
          action: 'Add List Failed',
          label: listURL,
        })
        setAddError(error.message)
        dispatch(removeList(listURL))
      })
  }, [adding, dispatch, fetchList, listURL, setModalView])

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          <ArrowLeft style={{ cursor: 'pointer' }} onClick={() => setModalView(CurrencyModalView.manage)} />
          <TYPE.mediumHeader>Import List</TYPE.mediumHeader>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <PaddedColumn gap="md">
        <AutoColumn gap="md">
          <Card backgroundColor={theme.bg2} padding="12px 20px">
            <RowBetween>
              <RowFixed>
                {list.logoURI && <ListLogo logoURI={list.logoURI} size="40px" />}
                <AutoColumn gap="sm" style={{ marginLeft: '20px' }}>
                  <RowFixed>
                    <TYPE.body fontWeight={600} mr="6px">
                      {list.name}
                    </TYPE.body>
                    <TextDot />
                    <TYPE.main fontSize={'16px'} ml="6px">
                      {list.tokens.length} tokens
                    </TYPE.main>
                  </RowFixed>
                  <ExternalLink href={`https://tokenlists.org/token-list?url=${listURL}`}>
                    <TYPE.main fontSize={'12px'} color={theme.blue1}>
                      {listURL}
                    </TYPE.main>
                  </ExternalLink>
                </AutoColumn>
              </RowFixed>
            </RowBetween>
          </Card>
          <Card style={{ backgroundColor: transparentize(0.8, theme.red1) }}>
            <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
              <AlertTriangle stroke={theme.red1} size={32} />
              <TYPE.body fontWeight={500} fontSize={20} color={theme.red1}>
                Import at your own risk{' '}
              </TYPE.body>
            </AutoColumn>

            <AutoColumn style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
              <TYPE.body fontWeight={500} color={theme.red1}>
                By adding this list you are implicitly trusting that the data is correct. Anyone can create a list,
                including creating fake versions of existing lists and lists that claim to represent projects that do
                not have one.
              </TYPE.body>
              <TYPE.body fontWeight={600} color={theme.red1}>
                If you purchase a token from this list, you may not be able to sell it back.
              </TYPE.body>
            </AutoColumn>
            <AutoRow justify="center" style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
              <Checkbox
                name="confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
              />
              <TYPE.body ml="10px" fontSize="16px" color={theme.red1} fontWeight={500}>
                I understand
              </TYPE.body>
            </AutoRow>
          </Card>

          <ButtonPrimary
            disabled={!confirmed}
            altDisabledStyle={true}
            borderRadius="20px"
            padding="10px 1rem"
            onClick={handleAddList}
          >
            Import
          </ButtonPrimary>
          {addError ? (
            <TYPE.error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
              {addError}
            </TYPE.error>
          ) : null}
        </AutoColumn>
        {/* </Card> */}
      </PaddedColumn>
    </Wrapper>
  )
}

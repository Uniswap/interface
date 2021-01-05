import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import ReactGA from 'react-ga'
import { TYPE, CloseIcon } from 'theme'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { ButtonPrimary } from 'components/Button'
import { SectionBreak } from 'components/swap/styleds'
import { IconWrapper, ExternalLink } from '../../theme/components'
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
          label: listURL
        })

        // turn list on
        dispatch(enableList(listURL))
        // go back to lists
        setModalView(CurrencyModalView.manage)
      })
      .catch(error => {
        ReactGA.event({
          category: 'Lists',
          action: 'Add List Failed',
          label: listURL
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
          <TYPE.mediumHeader>Confirm List</TYPE.mediumHeader>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <PaddedColumn gap="md">
        <Card bg={theme.bg3}>
          <AutoColumn gap="md">
            <Row justify="center">
              <IconWrapper stroke={theme.red1} size="32px">
                <AlertTriangle />
              </IconWrapper>
            </Row>
            <TYPE.largeHeader color={theme.red1} textAlign="center">
              Custom List
            </TYPE.largeHeader>
            <TYPE.body>
              You are importing a list from{' '}
              <ExternalLink href={`https://tokenlists.org/token-list?url=${listURL}`}>
                <TYPE.main color={theme.blue1}>{listURL}</TYPE.main>
              </ExternalLink>
            </TYPE.body>
            <TYPE.body>Please take extra caution and do your research when interacting with imported lists.</TYPE.body>
            <TYPE.body fontWeight={600} color={theme.red1}>
              By adding this list you are implicity trusting that the data is corerct.
            </TYPE.body>
            <TYPE.body>If you purchase a token form this list, you may be unable to sell it back.</TYPE.body>
            <Row>
              <RowFixed style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
                <Checkbox
                  name="confirmed"
                  type="checkbox"
                  checked={confirmed}
                  onChange={() => setConfirmed(!confirmed)}
                />
                <TYPE.body ml="10px" fontSize="16px" fontWeight={500}>
                  I understand
                </TYPE.body>
              </RowFixed>
            </Row>
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
        </Card>
        <OutlineCard padding="12px 20px">
          <RowBetween>
            <RowFixed>
              {list.logoURI && <ListLogo logoURI={list.logoURI} size="40px" />}
              <AutoColumn gap="sm" style={{ marginLeft: '20px' }}>
                <TYPE.body fontWeight={600}>{list.name}</TYPE.body>
                <RowFixed>
                  <TYPE.main fontSize={'12px'} mr="6px">
                    {list.tokens.length} tokens
                  </TYPE.main>
                  <TextDot />
                  <ExternalLink href={`https://tokenlists.org/token-list?url=${listURL}`}>
                    <TYPE.main fontSize={'12px'} ml="6px" color={theme.blue1}>
                      View List
                    </TYPE.main>
                  </ExternalLink>
                </RowFixed>
              </AutoColumn>
            </RowFixed>
          </RowBetween>
        </OutlineCard>
      </PaddedColumn>
    </Wrapper>
  )
}

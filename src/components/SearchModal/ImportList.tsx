import { Trans } from '@lingui/macro'
import { TokenList } from '@uniswap/token-lists'
import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import ListLogo from 'components/ListLogo'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { SectionBreak } from 'components/swap/styleds'
import { useFetchListCallback } from 'hooks/useFetchListCallback'
import useTheme from 'hooks/useTheme'
import { transparentize } from 'polished'
import { useCallback, useState } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga4'
import { useAppDispatch } from 'state/hooks'
import { enableList, removeList } from 'state/lists/actions'
import { useAllLists } from 'state/lists/hooks'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import { ExternalLink } from '../../theme'
import { CurrencyModalView } from './CurrencySearchModal'
import { Checkbox, PaddedColumn, TextDot } from './styleds'

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
  const dispatch = useAppDispatch()

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
          <ThemedText.MediumHeader>
            <Trans>Import List</Trans>
          </ThemedText.MediumHeader>
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
                    <ThemedText.Body fontWeight={600} mr="6px">
                      {list.name}
                    </ThemedText.Body>
                    <TextDot />
                    <ThemedText.Main fontSize={'16px'} ml="6px">
                      <Trans>{list.tokens.length} tokens</Trans>
                    </ThemedText.Main>
                  </RowFixed>
                  <ExternalLink href={`https://tokenlists.org/token-list?url=${listURL}`}>
                    <ThemedText.Main fontSize={'12px'} color={theme.blue1}>
                      {listURL}
                    </ThemedText.Main>
                  </ExternalLink>
                </AutoColumn>
              </RowFixed>
            </RowBetween>
          </Card>
          <Card style={{ backgroundColor: transparentize(0.8, theme.red1) }}>
            <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
              <AlertTriangle stroke={theme.red1} size={32} />
              <ThemedText.Body fontWeight={500} fontSize={20} color={theme.red1}>
                <Trans>Import at your own risk</Trans>
              </ThemedText.Body>
            </AutoColumn>

            <AutoColumn style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
              <ThemedText.Body fontWeight={500} color={theme.red1}>
                <Trans>
                  By adding this list you are implicitly trusting that the data is correct. Anyone can create a list,
                  including creating fake versions of existing lists and lists that claim to represent projects that do
                  not have one.
                </Trans>
              </ThemedText.Body>
              <ThemedText.Body fontWeight={600} color={theme.red1}>
                <Trans>If you purchase a token from this list, you may not be able to sell it back.</Trans>
              </ThemedText.Body>
            </AutoColumn>
            <AutoRow justify="center" style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
              <Checkbox
                name="confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
              />
              <ThemedText.Body ml="10px" fontSize="16px" color={theme.red1} fontWeight={500}>
                <Trans>I understand</Trans>
              </ThemedText.Body>
            </AutoRow>
          </Card>

          <ButtonPrimary
            disabled={!confirmed}
            altDisabledStyle={true}
            $borderRadius="20px"
            padding="10px 1rem"
            onClick={handleAddList}
          >
            <Trans>Import</Trans>
          </ButtonPrimary>
          {addError ? (
            <ThemedText.Error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
              {addError}
            </ThemedText.Error>
          ) : null}
        </AutoColumn>
        {/* </Card> */}
      </PaddedColumn>
    </Wrapper>
  )
}

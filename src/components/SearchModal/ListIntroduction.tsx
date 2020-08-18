import React, { memo, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import { AppDispatch, AppState } from '../../state'
import { addList, selectList } from '../../state/lists/actions'
import { ExternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { OutlineCard } from '../Card'
import Column, { AutoColumn } from '../Column'
import ListLogo from '../ListLogo'
import Row from '../Row'
import { PaddedColumn } from './styleds'

const ListCard = memo(function ListCard({ id, listUrl }: { id: string; listUrl: string }) {
  const dispatch = useDispatch<AppDispatch>()

  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const list = listsByUrl[listUrl]?.current

  useEffect(() => {
    if (!listsByUrl[listUrl]) dispatch(addList(listUrl))
  }, [dispatch, listUrl, listsByUrl])

  const handleSelect = useCallback(() => {
    dispatch(selectList(listUrl))
  }, [dispatch, listUrl])

  if (!list) return null

  return (
    <OutlineCard id={id}>
      <Row align="center">
        {list.logoURI ? <ListLogo style={{ marginRight: '0.5rem' }} logoURI={list.logoURI} /> : null}
        <Text fontWeight={500} style={{ flex: '1' }}>
          {list.name}
        </Text>
        <ButtonPrimary
          className="select-button"
          style={{ width: '6rem', padding: '0.5rem 1rem' }}
          onClick={handleSelect}
        >
          Select
        </ButtonPrimary>
      </Row>
    </OutlineCard>
  )
})

export default function ListIntroduction() {
  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn>
        <AutoColumn gap="14px">
          <Text fontWeight={500} fontSize={20}>
            Select a list
          </Text>
          <Text>
            Token lists are an{' '}
            <ExternalLink href="https://github.com/uniswap/token-lists">open specification</ExternalLink> for lists of
            tokens supported by the Uniswap Interface. You can switch between token lists and add your own custom lists
            via IPFS, HTTPS and ENS. Get started by selecting one below.
          </Text>
          <ListCard id="select-kleros-list" listUrl={'t2crtokens.eth'} />
          <ListCard id="select-1inch-list" listUrl={'tokens.1inch.eth'} />
          <ListCard id="select-default-uniswap-list" listUrl={'tokens.uniswap.eth'} />
        </AutoColumn>
      </PaddedColumn>
    </Column>
  )
}

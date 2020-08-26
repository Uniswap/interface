import React, { memo, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import { AppDispatch, AppState } from '../../state'
import { addList, selectList } from '../../state/lists/actions'
import { ExternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { OutlineCard, GreyCard } from '../Card'
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
    <OutlineCard style={{ padding: '0.5rem .75rem' }} id={id}>
      <Row align="center">
        {list.logoURI ? (
          <ListLogo style={{ marginRight: '0.5rem' }} logoURI={list.logoURI} alt={`${list.name} list logo`} />
        ) : null}
        <Text fontWeight={500} style={{ flex: '1' }}>
          {list.name}
        </Text>
        <ButtonPrimary
          className="select-button"
          style={{ width: '6rem', padding: '0.5rem .35rem', borderRadius: '12px' }}
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
          <Text fontWeight={600} fontSize={20}>
            Select a list
          </Text>
          <Text style={{ marginBottom: '8px' }}>
            Get started by selecting a token list below. You can switch between token lists and add your own custom
            lists via IPFS, HTTPS and ENS.
          </Text>
          <ListCard id="select-kleros-list" listUrl={'t2crtokens.eth'} />
          <ListCard
            id="select-1inch-list"
            listUrl={'https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json'}
          />
          <ListCard id="select-default-uniswap-list" listUrl={'tokens.uniswap.eth'} />
          <GreyCard style={{ marginBottom: '8px', padding: '1rem' }}>
            <Text fontWeight={400} fontSize={14} style={{ textAlign: 'center' }}>
              Token lists are an{' '}
              <ExternalLink href="https://github.com/uniswap/token-lists">open specification</ExternalLink>. Check out{' '}
              <ExternalLink href="https://tokenlists.org">tokenlists.org</ExternalLink> to find more lists.
            </Text>
          </GreyCard>
        </AutoColumn>
      </PaddedColumn>
    </Column>
  )
}

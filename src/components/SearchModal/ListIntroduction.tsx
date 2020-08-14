import React, { memo, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Text } from 'rebass'
import { AppDispatch } from '../../state'
import { addList, selectList } from '../../state/lists/actions'
import { ButtonPrimary } from '../Button'
import { OutlineCard } from '../Card'
import Column, { AutoColumn } from '../Column'
import Row from '../Row'
import { PaddedColumn } from './styleds'

const ListCard = memo(function ListCard({ listName, listUrl }: { listName: string; listUrl: string }) {
  const dispatch = useDispatch<AppDispatch>()

  const selectCoingecko = useCallback(() => {
    dispatch(addList(listUrl))
    dispatch(selectList(listUrl))
  }, [dispatch, listUrl])

  return (
    <OutlineCard>
      <Row align="center">
        <Text fontWeight={500} style={{ flex: '1' }}>
          {listName}
        </Text>
        <ButtonPrimary style={{ width: '6rem', padding: '0.5rem 1rem' }} onClick={selectCoingecko}>
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
            You can switch between token lists and add your own custom lists via IPFS, HTTPS and ENS. Get started by
            selecting one below.
          </Text>
          <ListCard listName={'Kleros Token Curated Registry List'} listUrl={'t2crtokens.eth'} />
          <ListCard listName={'1inch Exchange Token List'} listUrl={'tokens.1inch.eth'} />
          <ListCard listName={'Uniswap Default List'} listUrl={'https://tokens.uniswap.org'} />
        </AutoColumn>
      </PaddedColumn>
    </Column>
  )
}

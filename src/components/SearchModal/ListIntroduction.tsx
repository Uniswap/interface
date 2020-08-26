import React from 'react'
import { Text } from 'rebass'
import { ExternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { OutlineCard } from '../Card'
import Column, { AutoColumn } from '../Column'
import { PaddedColumn } from './styleds'

export default function ListIntroduction({ onSelectList }: { onSelectList: () => void }) {
  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn>
        <AutoColumn gap="14px">
          <Text fontWeight={600} fontSize={20}>
            Token Lists
          </Text>
          <Text style={{ marginBottom: '8px' }}>
            You can switch between lists of tokens, as well as add your own custom lists via IPFS, HTTPS and ENS.{' '}
            <i>Start by choosing a list.</i>
          </Text>
          <ButtonPrimary onClick={onSelectList}>Choose a list</ButtonPrimary>
          <OutlineCard style={{ marginBottom: '8px', padding: '1rem' }}>
            <Text fontWeight={400} fontSize={14} style={{ textAlign: 'center' }}>
              Token lists are an{' '}
              <ExternalLink href="https://github.com/uniswap/token-lists">open specification</ExternalLink>. Check out{' '}
              <ExternalLink href="https://tokenlists.org">tokenlists.org</ExternalLink> to learn more.
            </Text>
          </OutlineCard>
        </AutoColumn>
      </PaddedColumn>
    </Column>
  )
}

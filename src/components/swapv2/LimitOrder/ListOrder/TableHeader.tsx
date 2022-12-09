import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { MEDIA_WIDTHS } from 'theme'

import { ItemWrapper } from './OrderItem'

const Header = styled(ItemWrapper)`
  background-color: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  border-radius: 20px 20px 0px 0px;
  font-size: 12px;
  font-weight: 500;
  padding: 16px 12px;
  border-bottom: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0px;
    padding-left: 30px;
    margin-left: -30px;
    width: 110vw;
  `};
`

const TableHeader = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <Header>
      {!upToSmall ? (
        <>
          <Flex alignItems={'center'} style={{ gap: 10 }}>
            <Text>
              <Trans>TRADE</Trans>
            </Text>
          </Flex>
          <Text className="rate">
            <Trans>RATE</Trans>
          </Text>
          <Text>
            <Trans>CREATED | EXPIRY</Trans>
          </Text>
          <Text>
            <Trans> FILLED % | STATUS</Trans>
          </Text>
          <Text textAlign={'center'}>
            <Trans>ACTION</Trans>
          </Text>
        </>
      ) : (
        <Text>
          <Trans>TRADE</Trans>
        </Text>
      )}
    </Header>
  )
}

export default TableHeader

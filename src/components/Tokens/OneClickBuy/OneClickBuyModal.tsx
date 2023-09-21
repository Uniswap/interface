import { NativeCurrency } from '@uniswap/sdk-core'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import DefaultMenu from 'components/AccountDrawer/DefaultMenu'
import Modal from 'components/Modal'
import { QueryToken, TokenQueryData } from 'graphql/data/Token'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { useState } from 'react'
import { Field } from 'state/swap/actions'
import styled from 'styled-components'

import { OneClickBuySkeleton } from '../TokenDetails/Skeleton'
import { OneClickBuy } from '.'

const Container = styled.div`
  width: 100%;
`

export function OneClickBuyModal({
  isOpen,
  token,
  tokenQueryData,
  tokenPriceQuery,
}: {
  isOpen: boolean
  close: () => void
  token: NativeCurrency | Token | QueryToken | null
  tokenQueryData?: TokenQueryData
  tokenPriceQuery?: TokenPriceQuery
}) {
  const [showMenu, setShowMenu] = useState(false)
  const toggleMenu = () => setShowMenu(!showMenu)

  const { account } = useWeb3React()

  const [isClosed, setIsClosed] = useState(false)

  return (
    <Modal isOpen={isOpen && !isClosed} maxWidth={475}>
      <Container>
        {token && tokenQueryData && tokenPriceQuery ? (
          showMenu && !account ? (
            <DefaultMenu drawerOpen />
          ) : (
            <OneClickBuy
              toggleMenu={toggleMenu}
              token={token}
              tokenLogoUrl={tokenQueryData.project?.logoUrl}
              tokenPriceQuery={tokenPriceQuery}
              prefilledState={{
                independentField: Field.INPUT,
                typedValue: '0.1',
                [Field.INPUT]: { currencyId: 'ETH' },
                [Field.OUTPUT]: { currencyId: tokenQueryData.address },
              }}
              buyAmountOptions={['0.05', '0.1', '0.5']}
              close={() => setIsClosed(true)}
            />
          )
        ) : (
          <OneClickBuySkeleton />
        )}
      </Container>
    </Modal>
  )
}

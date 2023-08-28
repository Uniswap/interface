import { NativeCurrency } from '@uniswap/sdk-core'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/Modal'
import WalletModal from 'components/WalletModal'
import { QueryToken, TokenQueryData } from 'graphql/data/Token'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef, useState } from 'react'
import { Field } from 'state/swap/actions'
import styled from 'styled-components'

import { OneClickBuySkeleton } from '../TokenDetails/Skeleton'
import { OneClickBuy } from '.'

const Container = styled.div`
  width: 100%;
`

export function OneClickBuyModal({
  isOpen,
  close,
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

  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, close)

  return (
    <Modal isOpen={isOpen} maxWidth={475} minHeight={40}>
      <Container ref={node}>
        {token && tokenQueryData && tokenPriceQuery ? (
          showMenu && !account ? (
            <WalletModal openSettings={() => console.log('hi')} />
          ) : (
            <OneClickBuy
              toggleMenu={toggleMenu}
              token={token}
              chainId={token.chainId}
              tokenLogoUrl={tokenQueryData.project?.logoUrl}
              tokenPriceQuery={tokenPriceQuery}
              prefilledState={{
                independentField: Field.INPUT,
                typedValue: '0.1',
                [Field.INPUT]: { currencyId: 'ETH' },
                [Field.OUTPUT]: { currencyId: tokenQueryData.address },
              }}
            />
          )
        ) : (
          <OneClickBuySkeleton />
        )}
      </Container>
    </Modal>
  )
}

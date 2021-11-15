import Davatar from '@davatar/react'
import { Web3Provider } from '@ethersproject/providers'
import jazzicon from '@metamask/jazzicon'
import { Component, createRef, useMemo } from 'react'
import styled from 'styled-components/macro'

import { useActiveWeb3React } from '../../hooks/web3'

const StyledIdenticonContainer = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.bg4};
`

interface IdenticonInnerProps {
  address?: string
  provider?: Web3Provider
}

class IdenticonInner extends Component<IdenticonInnerProps> {
  state: { fallback: boolean } = { fallback: false }
  ref = createRef<HTMLDivElement>()

  static getDerivedStateFromError() {
    // use Jazzicon if Davatar throws; Davatar throws when localStorage is blocked (eg on iframes)
    // see https://github.com/metaphor-xyz/davatar-helpers/issues/19
    return { fallback: true }
  }

  renderDavatar(address: string, provider: Web3Provider) {
    return <Davatar address={address} size={16} provider={provider} />
  }

  renderJazzicon(address?: string) {
    if (this.ref.current) {
      this.ref.current.innerHTML = ''
      if (address) {
        this.ref.current.appendChild(jazzicon(16, parseInt(address.slice(2, 10), 16)))
      }
    }
    return null
  }

  render() {
    return (
      <StyledIdenticonContainer ref={this.ref}>
        {this.props.address && this.props.provider && !this.state.fallback
          ? this.renderDavatar(this.props.address, this.props.provider)
          : this.renderJazzicon(this.props.address)}
      </StyledIdenticonContainer>
    )
  }
}

export default function Identicon() {
  const { account, library } = useActiveWeb3React()

  // restrict usage of Davatar until it stops sending 3p requests
  // see https://github.com/metaphor-xyz/davatar-helpers/issues/18
  const supportsENS = useMemo(() => {
    return ([1, 3, 4, 5] as Array<number | undefined>).includes(library?.network?.chainId)
  }, [library])

  return <IdenticonInner address={account ?? undefined} provider={(supportsENS && library) || undefined} />
}

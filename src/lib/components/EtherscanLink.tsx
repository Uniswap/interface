import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import styled, { Color } from 'lib/theme'
import { ReactNode, useMemo } from 'react'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import ExternalLink from './ExternalLink'

const Link = styled(ExternalLink)<{ color: Color }>`
  color: ${({ theme, color }) => theme[color]}
  text-decoration: none;
`

interface EtherscanLinkProps {
  type: ExplorerDataType
  data?: string
  color?: Color
  children: ReactNode
}

export default function EtherscanLink({ data, type, color = 'currentColor', children }: EtherscanLinkProps) {
  const { chainId } = useActiveWeb3React()
  const url = useMemo(
    () => data && getExplorerLink(chainId || SupportedChainId.MAINNET, data, type),
    [chainId, data, type]
  )
  return (
    <Link href={url} color={color} target="_blank">
      {children}
    </Link>
  )
}

import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import styled, { Color } from 'lib/theme'
import { ReactNode, useMemo } from 'react'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

interface EtherscanAProps {
  type: ExplorerDataType
  data?: string
  color?: Color
  children: ReactNode
}

const A = styled.a<{ color: Color }>`
  color: ${({ theme, color }) => theme[color]}
  text-decoration: none;
`

export default function EtherscanA({ data, type, color = 'currentColor', children }: EtherscanAProps) {
  const { chainId } = useActiveWeb3React()
  const url = useMemo(
    () => data && getExplorerLink(chainId || SupportedChainId.MAINNET, data, type),
    [chainId, data, type]
  )
  return (
    <A href={url} color={color} target="_blank">
      {children}
    </A>
  )
}

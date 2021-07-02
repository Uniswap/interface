import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { SupportedChainId } from '../../constants/chains'
import { useActiveWeb3React } from '../../hooks/web3'

export function MainnetOnly({ children }: { children: ReactNode }) {
  const { chainId } = useActiveWeb3React()
  if (!chainId) return null
  if (chainId !== SupportedChainId.MAINNET) {
    return (
      <div>
        <Trans>This page is supported on mainnet only.</Trans>
      </div>
    )
  }

  return <>{children}</>
}

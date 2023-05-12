// eslint-disable-next-line no-restricted-imports
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { L2_CHAIN_IDS } from 'constants/chains'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'

import MaxSlippageSettings from './MaxSlippageSettings'
import MenuButton from './MenuButton'
import RouterPreferenceSettings from './RouterPreferenceSettings'
import TransactionDeadlineSettings from './TransactionDeadlineSettings'

const Menu = styled.div`
  position: relative;
`

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 100%;
  margin-top: 8px;
  right: 0;
  z-index: 100;
  color: ${({ theme }) => theme.textPrimary};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 18.125rem;
  `};
  user-select: none;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.backgroundOutline};
`

export default function SettingsTab({ autoSlippage }: { autoSlippage: Percent }) {
  const { chainId } = useWeb3React()
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  const open = useModalIsOpen(ApplicationModal.SETTINGS)

  return (
    <Menu>
      <MenuButton />
      {open && (
        <MenuFlyout>
          <AutoColumn gap="16px" style={{ padding: '1rem' }}>
            {isSupportedChainId(chainId) && <RouterPreferenceSettings />}
            <Divider />
            <MaxSlippageSettings autoSlippage={autoSlippage} />
            {showDeadlineSettings && (
              <>
                <Divider />
                <TransactionDeadlineSettings />
              </>
            )}
          </AutoColumn>
        </MenuFlyout>
      )}
    </Menu>
  )
}

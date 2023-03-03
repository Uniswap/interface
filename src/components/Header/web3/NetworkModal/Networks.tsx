import { ChainId, getChainType } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { stringify } from 'querystring'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { useIsDarkMode } from 'state/user/hooks'

const NewLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 8px;
  border-radius: 999px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  height: 36px;
  ${({ theme, selected }) =>
    selected &&
    css`
      background-color: ${theme.darkMode ? theme.buttonBlack : theme.buttonGray};
      & > div {
        color: ${theme.text};
      }
    `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`

const SelectNetworkButton = styled(ButtonEmpty)<{ disabled: boolean }>`
  color: ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  text-decoration: none;
  transition: all 0.1s ease;
  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
    color: ${({ theme }) => theme.text} !important;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
    &:hover {
      border: 1px solid transparent;
    }
  }
`
const gap = '1rem'
const NetworkList = styled.div<{ mt: number; mb: number }>`
  display: flex;
  align-items: center;
  gap: ${gap};
  flex-wrap: wrap;
  width: 100%;
  margin-top: ${({ mt }) => mt}px;
  margin-bottom: ${({ mb }) => mb}px;
  & > * {
    width: calc(33.33% - ${gap} * 2 / 3);
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    & > * {
      width: calc(50% - ${gap} / 2);
    }
  `}
`

const CircleGreen = styled.div`
  height: 16px;
  width: 16px;
  background-color: ${({ theme }) => theme.primary};
  background-clip: content-box;
  border: solid 2px ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 8px;
  margin-left: auto;
`
const WalletWrapper = styled.div`
  height: 18px;
  width: 18px;
  margin-left: auto;
  margin-right: 4px;
  > img {
    height: 18px;
    width: 18px;
  }
`

const Networks = ({
  onChangedNetwork,
  mt = 30,
  mb = 0,
  isAcceptedTerm = true,
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  customToggleModal,
  disabledMsg,
  disabledAll,
  disabledAllMsg,
}: {
  onChangedNetwork?: () => void
  mt?: number
  mb?: number
  isAcceptedTerm?: boolean
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
  disabledAll?: boolean
  disabledAllMsg?: string
}) => {
  const { chainId: currentChainId } = useActiveWeb3React()
  const changeNetwork = useChangeNetwork()
  const qs = useParsedQueryString()
  const navigate = useNavigate()
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { walletEVM, walletSolana } = useActiveWeb3React()
  const onSelect = (chainId: ChainId) => {
    customToggleModal?.()
    if (customOnSelectNetwork) {
      customOnSelectNetwork(chainId)
    } else if (getChainType(currentChainId) === getChainType(chainId)) {
      changeNetwork(chainId, () => {
        const { inputCurrency, outputCurrency, ...rest } = qs
        navigate(
          {
            search: stringify(rest),
          },
          { replace: true },
        )
        onChangedNetwork?.()

        dispatch(updateChainId(chainId))
      })
    } else {
      changeNetwork(chainId, () => {
        navigate(
          {
            search: '',
          },
          { replace: true },
        )
        onChangedNetwork?.()
        dispatch(updateChainId(chainId))
      })
    }
  }

  return (
    <NetworkList mt={mt} mb={mb}>
      {MAINNET_NETWORKS.map((key: ChainId, i: number) => {
        const { iconDark, icon, name } = NETWORKS_INFO[key]
        const disabled = !isAcceptedTerm || (activeChainIds ? !activeChainIds?.includes(key) : false)
        const selected = selectedId === key

        const imgSrc = (isDarkMode ? iconDark : icon) || icon
        const walletKey =
          key === ChainId.SOLANA ? walletSolana.walletKey : walletEVM.chainId === key ? walletEVM.walletKey : null
        return (
          <MouseoverTooltip
            style={{ zIndex: Z_INDEXS.MODAL + 1 }}
            key={key}
            text={disabled ? disabledMsg : disabledAll ? disabledAllMsg : ''}
          >
            <SelectNetworkButton
              key={i}
              padding="0"
              onClick={() => !selected && onSelect(key)}
              disabled={disabledAll || disabled}
            >
              <ListItem selected={selected}>
                <img src={imgSrc} alt="Switch Network" style={{ height: '20px', width: '20px', marginRight: '8px' }} />
                <Text color={theme.subText}>{name}</Text>
                {key === ChainId.SOLANA && (
                  <NewLabel>
                    <Trans>New</Trans>
                  </NewLabel>
                )}
                {selected && !walletKey && <CircleGreen />}
                {walletKey && (
                  <WalletWrapper>
                    <img
                      src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                      alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                    />
                  </WalletWrapper>
                )}
              </ListItem>
            </SelectNetworkButton>
          </MouseoverTooltip>
        )
      })}
    </NetworkList>
  )
}

export default React.memo(Networks)

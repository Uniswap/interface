import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useCallback, useMemo } from 'react'
import { Copy, ExternalLink, Power } from 'react-feather'
import { Text } from 'rebass'
import { useCurrencyBalanceString } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'

import { shortenAddress } from '../../nft/utils/address'
import { useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import { ButtonPrimary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'

const UNIbutton = styled(ButtonPrimary)`
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 12px;
  color: white;
  border: none;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const USDText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 8px;
`

const FlexContainer = styled.div`
  display: flex;
`

const StatusWrapper = styled.div`
  display: inline-block;
  margin-top: 4px;
`

const BalanceWrapper = styled.div`
  padding: 16px 0;
`

const HeaderWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
`

const AuthenticatedHeaderWrapper = styled.div`
  padding: 0 16px;
`

const AuthenticatedHeader = () => {
  const { account, chainId, connector } = useWeb3React()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(account || '')
  }, [account, setCopied])
  const dispatch = useAppDispatch()
  const balanceString = useCurrencyBalanceString(account ?? '')
  const {
    nativeCurrency: { symbol: nativeCurrencySymbol },
    explorer,
  } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const connectionType = getConnection(connector).type
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined) || 0
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  const amountUSD = useMemo(() => {
    const price = parseFloat(nativeCurrencyPrice.toFixed(5))
    const balance = parseFloat(balanceString || '0')
    return price * balance
  }, [balanceString, nativeCurrencyPrice])

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <StatusWrapper>
          <FlexContainer>
            <StatusIcon connectionType={connectionType} size={24} />
            <Text fontSize={16} fontWeight={600} marginTop="2.5px">
              {account && shortenAddress(account, 2, 4)}
            </Text>
          </FlexContainer>
        </StatusWrapper>
        <IconContainer>
          <IconButton onClick={copy} Icon={Copy} text={isCopied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>} />
          <IconButton href={`${explorer}address/${account}`} Icon={ExternalLink} text={<Trans>Explore</Trans>} />
          <IconButton
            dataTestId="wallet-disconnect"
            onClick={disconnect}
            Icon={Power}
            text={<Trans>Disconnect</Trans>}
          />
        </IconContainer>
      </HeaderWrapper>
      <Column>
        <BalanceWrapper>
          <Text fontSize={36} fontWeight={400}>
            {balanceString} {nativeCurrencySymbol}
          </Text>
          <USDText>${amountUSD.toFixed(2)} USD</USDText>
        </BalanceWrapper>
        {isUnclaimed && (
          <UNIbutton onClick={openClaimModal}>
            <Trans>Claim</Trans> {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} <Trans>reward</Trans>
          </UNIbutton>
        )}
      </Column>
    </AuthenticatedHeaderWrapper>
  )
}

export default AuthenticatedHeader

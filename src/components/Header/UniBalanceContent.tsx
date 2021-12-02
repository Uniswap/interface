import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { CHAIN_INFO, SupportedChainId } from 'constants/chains'
import { useMemo } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'

import tokenLogo from '../../assets/images/token-logo.png'
import { UNI } from '../../constants/tokens'
import { useMerkleDistributorContract } from '../../hooks/useContract'
import useCurrentBlockTimestamp from '../../hooks/useCurrentBlockTimestamp'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import useUSDCPrice from '../../hooks/useUSDCPrice'
import { useActiveWeb3React } from '../../hooks/web3'
import { useTotalUniEarned } from '../../state/stake/hooks'
import { useAggregateUniBalance, useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE, UniTokenAnimated } from '../../theme'
import { computeUniCirculation } from '../../utils/computeUniCirculation'
import { AutoColumn } from '../Column'
import { Break, CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function UniBalanceContent({ setShowUniBalanceModal }: { setShowUniBalanceModal: any }) {
  const { account, chainId } = useActiveWeb3React()
  const uni = chainId ? UNI[chainId] : undefined

  const total = useAggregateUniBalance()
  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(account ?? undefined, uni)
  const uniToClaim: CurrencyAmount<Token> | undefined = useTotalUniEarned()

  const totalSupply: CurrencyAmount<Token> | undefined = useTotalSupply(uni)
  const uniPrice = useUSDCPrice(uni)
  const blockTimestamp = useCurrentBlockTimestamp()
  const unclaimedUni = useTokenBalance(useMerkleDistributorContract()?.address, uni)
  const circulation: CurrencyAmount<Token> | undefined = useMemo(
    () =>
      blockTimestamp && uni && chainId === 1 ? computeUniCirculation(uni, blockTimestamp, unclaimedUni) : totalSupply,
    [blockTimestamp, chainId, totalSupply, unclaimedUni, uni]
  )

  const { infoLink } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardBGImage />
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">
              <Trans>Your UNI Breakdown</Trans>
            </TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowUniBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UniTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">
                    <Trans>Balance:</Trans>
                  </TYPE.white>
                  <TYPE.white color="white">{uniBalance?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white color="white">
                    <Trans>Unclaimed:</Trans>
                  </TYPE.white>
                  <TYPE.white color="white">
                    {uniToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {uniToClaim && uniToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUniBalanceModal(false)} to="/uni">
                        <Trans>(claim)</Trans>
                      </StyledInternalLink>
                    )}
                  </TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.white color="white">
                <Trans>UNI price:</Trans>
              </TYPE.white>
              <TYPE.white color="white">${uniPrice?.toFixed(2) ?? '-'}</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">
                <Trans>UNI in circulation:</Trans>
              </TYPE.white>
              <TYPE.white color="white">{circulation?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">
                <Trans>Total Supply</Trans>
              </TYPE.white>
              <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
            {uni && uni.chainId === 1 ? (
              <ExternalLink href={`${infoLink}/token/${uni.address}`}>
                <Trans>View UNI Analytics</Trans>
              </ExternalLink>
            ) : null}
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}

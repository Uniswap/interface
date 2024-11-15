import { ChainId } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import tokenLogo from 'assets/images/token-logo.png'
import Loader from 'components-old/Loader'
import { UBE } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { t } from 'i18n'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useCUSDPrice } from 'pages/Farm/data/useCUSDPrice'
import { useEffect, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText, UbeTokenAnimated } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { relevantDigits } from 'utils/relevantDigits'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardNoise, CardSection, DataCard } from '../earn/styled'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, ${({ theme }) => theme.primary1} 0%, #021d43 100%), #edeef2;
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
export default function UbeBalanceContent({ setShowUbeBalanceModal }: { setShowUbeBalanceModal: any }) {
  const { account } = useWeb3React()
  const ube = UBE[ChainId.CELO]

  const ubeBalance = useTokenBalance(account ?? undefined, ube)
  // const ubeToClaim = useTotalUbeEarned()

  const oldUbeToken = useToken('0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC')
  const oldUbeBalance = useTokenBalance(account ?? undefined, oldUbeToken ?? undefined)

  const totalSupply = useTotalSupply(ube)
  const ubePrice = useCUSDPrice(ube)

  const [circulatingSupply, setCirculatingSupply] = useState<number | null>(null)
  useEffect(() => {
    fetch('https://api.ubeswap.org/api/ubeswap/circulating-supply')
      .then((response) => response.json())
      .then((data) => {
        setCirculatingSupply(Number(data.circulatingSupply))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

  const { formatNumber, formatCurrencyAmount } = useFormatter()

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <ThemedText.DeprecatedWhite color="white">Your UBE Breakdown</ThemedText.DeprecatedWhite>
            <StyledClose stroke="white" onClick={() => setShowUbeBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UbeTokenAnimated width="48px" src={tokenLogo} />{' '}
                <ThemedText.DeprecatedWhite fontSize={48} fontWeight={600} color="white">
                  {relevantDigits(ubeBalance)}
                </ThemedText.DeprecatedWhite>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedWhite color="white">{t('Balance')}:</ThemedText.DeprecatedWhite>
                  <ThemedText.DeprecatedWhite color="white">{relevantDigits(ubeBalance)}</ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedWhite color="white">Old Ube Balance:</ThemedText.DeprecatedWhite>
                  <ThemedText.DeprecatedWhite color="white">
                    {oldUbeBalance && oldUbeBalance.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUbeBalanceModal(false)} to="/claim-new-ube">
                        Convert
                      </StyledInternalLink>
                    )}
                    &nbsp;&nbsp;
                    {relevantDigits(oldUbeBalance)}
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                {/*<RowBetween>
                  <ThemedText.DeprecatedWhite color="white">{t('Unclaimed')}:</ThemedText.DeprecatedWhite>
                  <ThemedText.DeprecatedWhite color="white">
                    {ubeToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {ubeToClaim && ubeToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUbeBalanceModal(false)} to="/farm">
                        ({t('claim')})
                      </StyledInternalLink>
                    )}
                  </ThemedText.DeprecatedWhite>
                </RowBetween>*/}
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <ThemedText.DeprecatedWhite color="white">{t('UBE price')}:</ThemedText.DeprecatedWhite>
              <ThemedText.DeprecatedWhite color="white">${ubePrice?.toFixed(2) ?? '-'}</ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite color="white">{t('UBE in circulation')}:</ThemedText.DeprecatedWhite>
              <ThemedText.DeprecatedWhite color="white">
                {circulatingSupply == null ? (
                  <Loader />
                ) : (
                  formatNumber({
                    input: circulatingSupply,
                    type: NumberType.TokenNonTx,
                  })
                )}
              </ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite color="white">{t('Total Supply')}</ThemedText.DeprecatedWhite>
              <ThemedText.DeprecatedWhite color="white">
                {formatCurrencyAmount({
                  amount: totalSupply,
                  type: NumberType.TokenNonTx,
                }) || <Loader />}
              </ThemedText.DeprecatedWhite>
            </RowBetween>
            {ube && ube.chainId === ChainId.CELO ? (
              <ExternalLink href={`https://info.ubeswap.org/#/celo/tokens/${ube.address}`}>
                {t('View UBE Analytics')}
              </ExternalLink>
            ) : null}
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </ModalUpper>
    </ContentWrapper>
  )
}

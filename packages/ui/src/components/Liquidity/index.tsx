import { JSBI } from '@teleswap/sdk'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogoHorizontal from 'components/DoubleLogo'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { useTotalSupply } from 'data/TotalSupply'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import AppBody from 'pages/AppBody'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { AppDispatch } from 'state'
import { Field, resetMintState } from 'state/mint/actions'
import { useTokenBalance } from 'state/wallet/hooks'
import styled from 'styled-components'
import { currencyId } from 'utils/currencyId'
import { wrappedCurrency } from 'utils/wrappedCurrency'

import LeftArrow from '../../assets/svg/LeftArrow.svg'
import { useDerivedMintInfo, useMintActionHandlers } from '../../state/mint/hooks'

const BorderVerticalContainer = styled(Flex)`
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  padding: 32px 24px;
  border-radius: 24px;
  flex-direction: column;
  color: white;
  gap: 24px;
`

export default function LiquidityDetail({
  history,
  match: {
    params: { currencyIdA, currencyIdB, stable }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; stable: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  } = useDerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    `${stable}`.toLowerCase() === 'true' ? true : `${stable}`.toLowerCase() === 'false' ? false : undefined
  )
  const [tokenA, tokenB] = useMemo(
    () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
    [currencyA, currencyB, chainId]
  )
  const userPoolBalance = useTokenBalance(account ?? undefined, pair?.liquidityToken)

  const totalPoolTokens = useTotalSupply(pair?.liquidityToken)
  const [token0Deposited, token1Deposited] = useMemo(() => {
    if (
      !!pair &&
      !!totalPoolTokens &&
      !!userPoolBalance &&
      JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
    ) {
      return [
        pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
        pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
      ]
    }
    return [undefined, undefined]
  }, [pair, totalPoolTokens, userPoolBalance])

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)
  const [txHash, setTxHash] = useState<string>('')

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const pendingText = useMemo(
    () =>
      `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
        currencies[Field.CURRENCY_A]?.symbol
      } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`,
    [currencies, parsedAmounts]
  )

  const claim = useCallback(() => {
    console.warn('not implemented')
  }, [])

  const modalHeader = useCallback(() => {
    return (
      <Flex>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gridTemplateRows: 'repeat(2, 1fr)',
            gridRowGap: '24px',
            gridAutoFlow: 'row',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '500',
            fontSize: '16px',
            lineHeight: '24px',
            color: '#FFFFFF'
          }}
        >
          <HeaderText>Token</HeaderText>
          <HeaderText>Value</HeaderText>
          <HeaderText>Amount</HeaderText>
          <Flex>
            <CurrencyLogo currency={currencyA} />
            <Text>{currencyA?.symbol?.toUpperCase()}</Text>
          </Flex>
          <Box>Current A Value</Box>
          <Box>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)}</Box>
          <Flex>
            <CurrencyLogo currency={currencyB} />
            <Text>{currencyB?.symbol?.toUpperCase()}</Text>
          </Flex>
          <Box>Current B Value</Box>
          <Box>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)}</Box>
        </Box>
        <ButtonPrimary
          onClick={claim}
          sx={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '500',
            fontSize: '24px',
            lineHeight: '32px',
            textAlign: 'center',
            color: '#05050E'
          }}
        >
          Claim
        </ButtonPrimary>
      </Flex>
    )
  }, [claim, currencyA, currencyB, parsedAmounts])

  return (
    <>
      <Flex alignItems={'flex-start'}>
        <BackToMyLiquidity />
      </Flex>
      <AppBody
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: '1.2rem .9rem',
          width: '21rem',
          // width: '556px',
          // maxWidth: '420px',
          // maxHeight: '638px',
          height: 'fit-content'
        }}
      >
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              // title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
              title={'Claim Fees'}
              onDismiss={handleDismissConfirmation}
              topContent={modalHeader}
              bottomContent={undefined}
            />
          )}
          pendingText={pendingText}
          currencyToAdd={pair?.liquidityToken}
        />
        <Flex flexDirection={'column'} width="640px">
          <Flex justifyContent={'space-between'}>
            <Flex sx={{ gap: '12px' }}>
              <DoubleCurrencyLogoHorizontal currency0={currencyA} currency1={currencyB} />
              <Text
                sx={{
                  fontFamily: 'Dela Gothic One',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  fontSize: '24px',
                  lineHeight: '32px',
                  alignItems: 'flex-end',
                  color: '#FFFFFF'
                }}
              >
                {currencyA?.symbol?.toUpperCase()}-{currencyB?.symbol?.toUpperCase()}
              </Text>
            </Flex>
            <Flex sx={{ gap: '12px' }}>
              <ButtonPrimary
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: '#000000'
                }}
                as={Link}
                to={`/add/${currencyId(currencyA!)}/${currencyId(currencyB!)}`}
              >
                Increase
              </ButtonPrimary>
              <ButtonPrimary
                as={Link}
                to={`/remove/${currencyId(currencyA!)}/${currencyId(currencyB!)}`}
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: '#000000'
                }}
              >
                Remove
              </ButtonPrimary>
            </Flex>
          </Flex>
          <BorderVerticalContainer>
            <Text>Total Value</Text>
            <Text>$&nbsp;18</Text>
            <Box
              sx={{
                width: '100%',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                height: '0',
                margin: '24px 0'
              }}
            ></Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gridTemplateRows: 'repeat(3, 1fr)',
                gridRowGap: '24px',
                gridAutoFlow: 'row',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#FFFFFF'
              }}
            >
              <HeaderText>Token</HeaderText>
              <HeaderText>Value</HeaderText>
              <HeaderText>Amount</HeaderText>
              <HeaderText>Percent</HeaderText>
              <Flex sx={{ gap: '24px' }}>
                <CurrencyLogo currency={currencyA} />
                <Text>{currencyA?.symbol?.toUpperCase()}</Text>
              </Flex>
              <Box>Current A Value</Box>
              <Box>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)}</Box>
              <Box>{poolTokenPercentage?.toSignificant(4)}%</Box>
              <Flex sx={{ gap: '24px' }}>
                <CurrencyLogo currency={currencyB} />
                <Text>{currencyB?.symbol?.toUpperCase()}</Text>
              </Flex>
              <Box>Current B Value</Box>
              <Box>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)}</Box>
              <Box>{poolTokenPercentage?.toSignificant(4)}%</Box>
            </Box>
          </BorderVerticalContainer>
          <BorderVerticalContainer>
            <Flex>
              <Text>Unclaimed Earnings</Text>
              <ButtonPrimary
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: '#000000'
                }}
              >
                Claim
              </ButtonPrimary>
            </Flex>
            <Text>$&nbsp;1.8</Text>
            <Box
              sx={{
                width: '100%',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                height: '0',
                margin: '24px 0'
              }}
            ></Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: 'repeat(3, 1fr)',
                gridRowGap: '24px',
                gridAutoFlow: 'row'
              }}
            >
              <HeaderText>Token</HeaderText>
              <HeaderText>Value</HeaderText>
              <HeaderText>Amount</HeaderText>
              <Flex>
                <CurrencyLogo currency={currencyA} />
                <Text>{currencyA?.symbol?.toUpperCase()}</Text>
              </Flex>
              <Box>Current A Value</Box>
              <Box>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)}</Box>
              <Flex>
                <CurrencyLogo currency={currencyB} />
                <Text>{currencyB?.symbol?.toUpperCase()}</Text>
              </Flex>
              <Box>Current B Value</Box>
              <Box>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)}</Box>
            </Box>
          </BorderVerticalContainer>
          <BorderVerticalContainer>
            <Flex>
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#FFFFFF'
                }}
              >
                Price
              </Text>
              <Flex>
                <Text
                  sx={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: '500',
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: 'white'
                  }}
                >
                  {token0Deposited?.divide(token1Deposited).toSignificant(4)}
                </Text>
                <Text
                  sx={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: '#999999'
                  }}
                >
                  {currencyA?.symbol?.toUpperCase()} per {currencyB?.symbol?.toUpperCase()}
                </Text>
              </Flex>
            </Flex>
          </BorderVerticalContainer>
        </Flex>
      </AppBody>
    </>
  )
}

export function BackToMyLiquidity() {
  // reset states on back
  const dispatch = useDispatch<AppDispatch>()

  return (
    <Flex
      height={'1.8rem'}
      marginBottom={'1.6rem'}
      sx={{
        'a,img': {
          height: '1rem',
          width: '1rem'
        }
      }}
    >
      <Link
        to="/liquidity"
        onClick={() => {
          dispatch(resetMintState())
        }}
      >
        <img
          src={LeftArrow}
          alt="left-arrow"
          style={{
            display: 'flex',
            alignItems: 'baseline'
          }}
        />
      </Link>
      <Text
        sx={{
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: '500',
          fontSize: '1rem',
          lineHeight: '1rem',
          height: '1rem',
          color: '#FFFFFF'
        }}
      >
        Back to My Liquidity
      </Text>
    </Flex>
  )
}

const HeaderText = styled(Text)`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 22px;
  color: #cccccc;
`

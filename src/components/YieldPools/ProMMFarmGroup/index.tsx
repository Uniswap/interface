import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import HoverDropdown from 'components/HoverDropdown'
import Withdraw from 'components/Icons/Withdraw'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { useRewardTokenPrices } from 'state/farms/hooks'
import { useFailedNFTs, useFarmAction } from 'state/farms/promm/hooks'
import { ProMMFarm } from 'state/farms/promm/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { formatDollarAmount } from 'utils/numbers'

import { ClickableText, ProMMFarmTableHeader } from '../styleds'
import Row from './Row'
import {
  BtnPrimary,
  ConnectWalletButton,
  DepositButton,
  ForceWithdrawButton,
  HarvestAllButton,
  WithdrawButton,
} from './buttons'

const FarmContent = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  overflow: hidden;
`

const FarmRow = styled.div`
  height: 68px;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.4)};
  padding: 0 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  `}
`

type Props = {
  address: string
  onOpenModal: (
    modalType: 'forcedWithdraw' | 'harvest' | 'deposit' | 'withdraw' | 'stake' | 'unstake',
    pid?: number,
  ) => void
  farms: ProMMFarm[]
}

const ProMMFarmGroup: React.FC<Props> = ({ address, onOpenModal, farms }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)')

  const [userPoolFarmInfo, setUserPoolFarmInfo] = useState<{
    [pid: number]: {
      usdValue: number
      token0Amount: CurrencyAmount<Token>
      token1Amount: CurrencyAmount<Token>
    }
  }>({})

  const rewardAddresses = useMemo(() => {
    const rws = farms.reduce((acc, cur) => [...acc, ...cur.rewardTokens], [] as string[])
    return [...new Set(rws)]
  }, [farms])

  const rwTokenMap = useTokens(rewardAddresses)

  const rwTokens = useMemo(() => Object.values(rwTokenMap), [rwTokenMap])
  const prices = useRewardTokenPrices(rwTokens, VERSION.ELASTIC)

  const priceMap: { [key: string]: number } = useMemo(
    () =>
      prices?.reduce(
        (acc, cur, index) => ({
          ...acc,
          [rwTokens[index]?.isToken ? rwTokens[index].address : ZERO_ADDRESS]: cur,
        }),
        {},
      ),
    [prices, rwTokens],
  )

  const totalUserReward: { totalUsdValue: number; amounts: CurrencyAmount<Token>[] } = useMemo(() => {
    const temp: { [address: string]: BigNumber } = {}
    farms.forEach(farm => {
      const tks = farm.rewardTokens

      farm.userDepositedNFTs.forEach(pos => {
        pos.rewardPendings.forEach((amount, index) => {
          const tkAddress = tks[index]
          if (temp[tkAddress]) temp[tkAddress] = temp[tkAddress].add(amount)
          else temp[tkAddress] = amount
        })
      })
    })

    let usd = 0
    const amounts: CurrencyAmount<Token>[] = []

    Object.keys(temp).forEach((key: string) => {
      const token = rwTokenMap[key]
      const price = priceMap[key]

      if (token) {
        const amount = CurrencyAmount.fromRawAmount(token, temp[key].toString())
        usd += price * parseFloat(amount.toExact())
        if (amount.greaterThan(0)) amounts.push(amount)
      }
    })

    return {
      totalUsdValue: usd,
      amounts,
    }
  }, [farms, rwTokenMap, priceMap])

  const depositedUsd = Object.values(userPoolFarmInfo).reduce((acc, cur) => acc + cur.usdValue, 0)

  const userDepositedTokenAmounts = Object.values(userPoolFarmInfo).reduce<{
    [address: string]: CurrencyAmount<Token>
  }>((result, info) => {
    const address0 = info.token0Amount.currency.address
    const address1 = info.token1Amount.currency.address

    if (!result[address0]) result[address0] = info.token0Amount
    else result[address0] = result[address0].add(info.token0Amount)

    if (!result[address1]) result[address1] = info.token1Amount
    else result[address1] = result[address1].add(info.token1Amount)

    return result
  }, {})

  const failedNFTs = useFailedNFTs()
  const userNFTs = farms.map(farm => farm.userDepositedNFTs.map(item => item.tokenId.toString())).flat()
  const hasAffectedByFarmIssue = userNFTs.some(id => failedNFTs.includes(id))

  const toggleWalletModal = useWalletModalToggle()
  const posManager = useProAmmNFTPositionManagerContract()

  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account || ZERO_ADDRESS, address])
  const isApprovedForAll = res?.result?.[0]

  const { approve } = useFarmAction(address)
  const [approvalTx, setApprovalTx] = useState('')

  const isApprovalTxPending = useIsTransactionPending(approvalTx)

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  const aggregateDepositedInfo = useCallback(
    ({
      poolAddress,
      usdValue,
      token0Amount,
      token1Amount,
    }: {
      poolAddress: string | number
      usdValue: number
      token0Amount: CurrencyAmount<Token>
      token1Amount: CurrencyAmount<Token>
    }) => {
      setUserPoolFarmInfo(prev => ({
        ...prev,
        [poolAddress]: {
          usdValue,
          token0Amount,
          token1Amount,
        },
      }))
    },
    [],
  )

  const qs = useParsedQueryString()
  const tab = qs.type || 'active'

  if (!farms) return null

  const canHarvest = farms.some(farm => farm.userDepositedNFTs.some(pos => !!pos.rewardPendings.length))
  const canWithdraw = farms.some(farms => farms.userDepositedNFTs.length)

  const renderApproveButton = () => {
    if (isApprovedForAll || tab === 'ended') {
      return null
    }

    if (approvalTx && isApprovalTxPending) {
      return (
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
          disabled
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            <Dots>
              <Trans>Approving</Trans>
            </Dots>
          </Text>
        </ButtonPrimary>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={
          <Text color={theme.subText} as="span">
            <Trans>
              Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens). Then
              deposit your liquidity positions using the{' '}
              <Text as="span" color={theme.text}>
                Deposit
              </Text>{' '}
              button
            </Trans>
          </Text>
        }
        width="400px"
        placement="top"
      >
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            {approvalTx && isApprovalTxPending ? (
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            ) : (
              <Trans>Approve Farming Contract</Trans>
            )}
          </Text>
        </ButtonPrimary>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderTopButtonsOnDesktop = () => {
    if (!isApprovedForAll && res?.loading) {
      return <Dots />
    }

    return (
      <Flex sx={{ gap: '12px' }} alignItems="center">
        {!account ? <ConnectWalletButton onClick={toggleWalletModal} /> : renderApproveButton()}
        <DepositButton
          disabled={!account || !isApprovedForAll || tab === 'ended'}
          onClick={() => onOpenModal('deposit')}
        />
        <WithdrawButton
          disabled={!account || !canWithdraw || !isApprovedForAll}
          onClick={() => onOpenModal('withdraw')}
        />

        {!!hasAffectedByFarmIssue && <ForceWithdrawButton onClick={() => onOpenModal('forcedWithdraw')} />}
      </Flex>
    )
  }

  const renderFarmGroupHeaderOnDesktop = () => {
    return (
      <Flex
        sx={{
          alignItems: 'center',
          padding: '0 1rem',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '20px',
            color: theme.subText,
          }}
        >
          <Trans>Farming Contract</Trans>
        </Text>
        <Flex
          sx={{
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Flex
            alignItems="center"
            sx={{
              gap: '12px',
            }}
          >
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
              <InfoHelper
                text={t`Total value of liquidity positions (i.e. NFT tokens) you've deposited into the farming contract`}
                placement="top"
              />
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={
                account ? (
                  <Text
                    as="span"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  >
                    {formatDollarAmount(depositedUsd)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account}
              dropdownContent={
                Object.values(userDepositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                  <AutoColumn gap="sm">
                    {Object.values(userDepositedTokenAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>
          {renderTopButtonsOnDesktop()}
        </Flex>
      </Flex>
    )
  }

  const renderFarmGroupHeaderOnMobile = () => {
    const renderDepositedLiquidity = () => {
      return (
        <Flex
          flexDirection="column"
          justifyContent={'center'}
          sx={{
            gap: '4px',
          }}
        >
          <Text fontSize="12px" color={theme.subText}>
            <Trans>Deposited Liquidity</Trans>
          </Text>

          <HoverDropdown
            style={{
              padding: '0',
            }}
            content={
              account ? (
                <Text
                  as="span"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                >
                  {formatDollarAmount(depositedUsd)}
                </Text>
              ) : (
                '--'
              )
            }
            hideIcon={!account}
            dropdownContent={
              Object.values(userDepositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                <AutoColumn gap="sm">
                  {Object.values(userDepositedTokenAmounts).map(
                    amount =>
                      amount.greaterThan(0) && (
                        <Flex alignItems="center" key={amount.currency.address}>
                          <CurrencyLogo currency={amount.currency} size="16px" />
                          <Text fontSize="12px" marginLeft="4px">
                            {amount.toSignificant(8)}
                          </Text>
                        </Flex>
                      ),
                  )}
                </AutoColumn>
              ) : (
                ''
              )
            }
          />
        </Flex>
      )
    }

    const renderLeftGroup = () => {
      if (!account) {
        return <ConnectWalletButton onClick={toggleWalletModal} />
      }

      if (!isApprovedForAll) {
        if (res?.loading) {
          return <Dots />
        }

        return (
          <ButtonPrimary
            style={{
              whiteSpace: 'nowrap',
              height: '38px',
              padding: '0 12px',
            }}
            onClick={handleApprove}
          >
            <MouseoverTooltip
              text={
                <Text color={theme.subText} as="span">
                  <Trans>
                    Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens).
                    Then deposit your liquidity positions using the{' '}
                    <Text as="span" color={theme.text}>
                      Deposit
                    </Text>{' '}
                    button
                  </Trans>
                </Text>
              }
              placement="top"
            >
              <Flex width="24px" height="24px" justifyContent="center" alignItems="center">
                <Info
                  width="16px"
                  height="16px"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                />
              </Flex>
            </MouseoverTooltip>

            <Text fontSize="14px">
              {approvalTx && isApprovalTxPending ? (
                <Dots>
                  <Trans>Approving</Trans>
                </Dots>
              ) : (
                <Trans>Approve</Trans>
              )}
            </Text>
          </ButtonPrimary>
        )
      }

      return renderDepositedLiquidity()
    }

    return (
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '8px',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            height: '100%',
            flex: '1 1',
          }}
        >
          {renderLeftGroup()}
        </Flex>
        <DepositButton
          disabled={!account || !isApprovedForAll || tab === 'ended'}
          onClick={() => onOpenModal('deposit')}
          style={{
            flex: '0 0 44px',
          }}
        />
        <WithdrawButton
          disabled={!account || !canWithdraw || !isApprovedForAll}
          onClick={() => onOpenModal('withdraw')}
          style={{
            flex: '0 0 44px',
          }}
        />
      </Flex>
    )
  }

  const renderTableHeaderOnDesktop = () => {
    return (
      <ProMMFarmTableHeader>
        <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Pool</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Staked TVL</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>AVG APR</Trans>
          </ClickableText>
          <InfoHelper
            text={t`Average estimated return based on yearly fees of the pool and if it's still active, plus bonus rewards of the pool`}
          />
        </Flex>

        <Flex grid-area="end" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Ending In</Trans>
          </ClickableText>
          <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Deposit</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Rewards</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Actions</Trans>
          </ClickableText>
        </Flex>
      </ProMMFarmTableHeader>
    )
  }

  const renderRewardRowOnDesktop = () => {
    return (
      <FarmRow>
        <Flex
          alignItems="center"
          sx={{ gap: '24px' }}
          justifyContent={above768 ? 'flex-end' : 'space-between'}
          width={above768 ? undefined : '100%'}
        >
          <Flex
            alignItems="center"
            sx={{
              gap: '8px',
            }}
          >
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Total Rewards</Trans>
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={
                account ? (
                  <Text
                    as="span"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  >
                    {formatDollarAmount(totalUserReward.totalUsdValue)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account}
              dropdownContent={
                totalUserReward.amounts.length ? (
                  <AutoColumn gap="sm">
                    {totalUserReward.amounts.map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>

          <HarvestAllButton onClick={() => onOpenModal('harvest')} disabled={!account || !canHarvest} />
        </Flex>

        {hasAffectedByFarmIssue && !above768 && (
          <BtnPrimary
            style={{ color: theme.red, border: `1px solid ${theme.red}`, background: theme.red + '33' }}
            padding={'12px'}
            onClick={() => onOpenModal('forcedWithdraw')}
          >
            <Withdraw width={20} height={20} />
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Force Withdraw</Trans>
            </Text>
          </BtnPrimary>
        )}
      </FarmRow>
    )
  }

  const renderRewardRowOnMobile = () => {
    return (
      <Flex
        sx={{
          height: '68px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Flex
          flexDirection="column"
          justifyContent={'center'}
          sx={{
            gap: '4px',
          }}
        >
          <Text fontSize="12px" color={theme.subText}>
            <Trans>Total Rewards</Trans>
          </Text>

          <HoverDropdown
            style={{ padding: '0' }}
            content={
              account ? (
                <Text
                  as="span"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                >
                  {formatDollarAmount(totalUserReward.totalUsdValue)}
                </Text>
              ) : (
                '--'
              )
            }
            hideIcon={!account}
            dropdownContent={
              totalUserReward.amounts.length ? (
                <AutoColumn gap="sm">
                  {totalUserReward.amounts.map(
                    amount =>
                      amount.greaterThan(0) && (
                        <Flex alignItems="center" key={amount.currency.address}>
                          <CurrencyLogo currency={amount.currency} size="16px" />
                          <Text fontSize="12px" marginLeft="4px">
                            {amount.toSignificant(8)}
                          </Text>
                        </Flex>
                      ),
                  )}
                </AutoColumn>
              ) : (
                ''
              )
            }
          />
        </Flex>

        <HarvestAllButton onClick={() => onOpenModal('harvest')} disabled={!account || !canHarvest} />
      </Flex>
    )
  }

  return (
    <FarmContent>
      {above1000 ? (
        <>
          {renderFarmGroupHeaderOnDesktop()}
          {renderTableHeaderOnDesktop()}
          {renderRewardRowOnDesktop()}
        </>
      ) : (
        <Flex flexDirection="column" padding="0 1rem" sx={{ backgroundColor: rgba(theme.buttonBlack, 0.4) }}>
          {renderFarmGroupHeaderOnMobile()}
          <Divider />
          {renderRewardRowOnMobile()}
          {!!hasAffectedByFarmIssue && (
            <ForceWithdrawButton
              style={{ width: '100%', marginBottom: '1rem' }}
              onClick={() => onOpenModal('forcedWithdraw')}
            />
          )}
        </Flex>
      )}

      <Divider />

      {farms.map((farm, index) => {
        return (
          <Row
            isUserAffectedByFarmIssue={hasAffectedByFarmIssue}
            isApprovedForAll={isApprovedForAll}
            farm={farm}
            key={farm.poolAddress + '_' + index}
            onOpenModal={onOpenModal}
            onUpdateDepositedInfo={aggregateDepositedInfo}
            fairlaunchAddress={address}
            onHarvest={() => {
              onOpenModal('harvest', farm.pid)
            }}
          />
        )
      })}
    </FarmContent>
  )
}

export default ProMMFarmGroup

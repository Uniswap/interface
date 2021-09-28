import React, { Fragment, useCallback } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import styled from 'styled-components'
import { Box, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'

import { ChainId, Currency, ETHER } from 'libs/sdk/src'
import { ZERO_ADDRESS } from 'constants/index'
import Modal from 'components/Modal'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useFarmHistoryModalToggle } from 'state/application/hooks'
import { Farm, FarmHistory, FarmHistoryMethod } from 'state/farms/types'
import { useYieldHistories } from 'state/farms/hooks'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { convertToNativeTokenFromETH } from 'utils/dmm'

const Wrapper = styled.div`
  width: 100%;
  padding: 28px 34px 40px;
  max-height: 80vh;
  .title {
    padding-bottom: 15px;
    border-bottom: 1px solid #5b676d;
    margin-bottom: 15px;
    font-size: 18px;
    text-align: center;
  }
  .break-word {
    word-break: break-word;
  }
`
const Row = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  grid-gap: 5px;
  margin-top: 17px;
`
const ScrollAble = styled.div`
  height: 100%;
  overflow-y: auto;
  padding-right: 10px;
  &::-webkit-scrollbar {
    width: 5px;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  /* Handle */
  &::-webkit-scrollbar-thumb {
    background: #8f8f8f;
  }

  /* Handle on hover */
  &::-webkit-scrollbar-thumb:hover {
    background: #8f8f8f;
  }
`

const LPTokenSymbol = ({ farm }: { farm: Farm }) => {
  const currency0 = useToken(farm.token0?.id)
  const currency1 = useToken(farm.token1?.id)

  return (
    <span>
      {currency0 && currency0.symbol}-{currency1 && currency1.symbol} LP
    </span>
  )
}

const NativeRewardTokenSymbol = ({ chainId }: { chainId?: ChainId }) => {
  return <span>{convertToNativeTokenFromETH(ETHER, chainId).symbol}</span>
}

const RewardTokenSymbol = ({ address }: { address: string }) => {
  const token = useToken(address) as Currency

  if (!token) {
    return null
  }

  return <span>{token.symbol}</span>
}

const FarmHistoryModal = ({ farms }: { farms: Farm[] }) => {
  const { chainId } = useActiveWeb3React()
  const farmHistoryModalOpen = useModalOpen(ApplicationModal.FARM_HISTORY)
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const { loading, data: histories } = useYieldHistories(farmHistoryModalOpen)

  const tokenToFarm = useCallback(
    (id: string) => {
      const index = farms.findIndex(farm => {
        return farm.id.toLocaleLowerCase() === id.toLocaleLowerCase()
      })
      if (index !== -1) {
        return farms[index]
      }
      return
    },
    [farms]
  )

  const getTokenLabel = (history: FarmHistory, chainId?: ChainId) => {
    if (
      (history.stakeToken && history.method === FarmHistoryMethod.DEPOSIT) ||
      history.method === FarmHistoryMethod.WITHDRAW
    ) {
      const farm = tokenToFarm(history.stakeToken as string)
      return farm ? <LPTokenSymbol farm={farm} /> : 'KNC'
    } else if (
      (history.rewardToken && history.method === FarmHistoryMethod.HARVEST) ||
      history.method === FarmHistoryMethod.CLAIM
    ) {
      if (history.rewardToken === ZERO_ADDRESS) {
        return <NativeRewardTokenSymbol chainId={chainId} />
      }

      return <RewardTokenSymbol address={history.rewardToken as string} />
    } else {
      return t`Unknown`
    }
  }

  const getMethodLabel = (method: FarmHistoryMethod) => {
    switch (method) {
      case FarmHistoryMethod.DEPOSIT:
        return t`DEPOSIT`
      case FarmHistoryMethod.WITHDRAW:
        return t`WITHDRAW`
      case FarmHistoryMethod.HARVEST:
        return t`HARVEST`
      case FarmHistoryMethod.CLAIM:
        return t`CLAIM`
      default:
        return t`UNKNOWN`
    }
  }

  return (
    <Modal isOpen={farmHistoryModalOpen} onDismiss={toggleFarmHistoryModal} maxHeight="fit-content" maxWidth="570px">
      <Wrapper>
        <Box overflow="hidden" height="100%">
          <Text className="title">
            <Trans>History</Trans>
          </Text>
          {loading && (
            <Text textAlign="center" mt="3" fontSize="12px">
              <Loader />
            </Text>
          )}
          {!loading && histories.length === 0 && (
            <Text textAlign="center" mt="3" fontSize="12px">
              <Trans>No records found.</Trans>
            </Text>
          )}
          <ScrollAble>
            {histories.map(history => (
              <Fragment key={`${history.method}-${history.id}`}>
                <Row>
                  <Text fontSize="14px">{new Date(parseInt(history.timestamp) * 1000).toLocaleString()}</Text>
                  <Text className="break-word" fontSize="14px">
                    <Text mr={1} display="inline">
                      {getFullDisplayBalance(BigNumber.from(history.amount))}
                    </Text>
                    {getTokenLabel(history, chainId)}
                  </Text>
                  <Text fontSize="12px" textAlign="right">
                    {getMethodLabel(history.method)}
                  </Text>
                </Row>
              </Fragment>
            ))}
          </ScrollAble>
        </Box>
      </Wrapper>
    </Modal>
  )
}

export default FarmHistoryModal

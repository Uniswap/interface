import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useFarmHistoryModalToggle } from 'state/application/hooks'
import styled from 'styled-components'
import { Box, Text } from 'rebass'
import { useActiveWeb3React } from 'hooks'
import {
  MASTERCHEF_ADDRESS,
  REWARD_LOCKER_ADDRESS,
  FARM_DEPOSIT_TOPIC,
  FARM_HARVEST_TOPIC,
  FARM_CLAIM_TOPIC,
  FARM_TRANSFER_TOKEN_TOPIC,
  ETHERSCAN_API,
  ETHERSCAN_API_KEY,
  FARM_WITHDRAW_TOPIC
} from 'constants/index'
import { BigNumber } from '@ethersproject/bignumber'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { ChainId, Token } from 'libs/sdk/src'
import { Farm } from 'state/farms/types'
import { useToken } from 'hooks/Tokens'
import { Dots } from 'components/swap/styleds'

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
  grid-template-columns: 1.5fr 2fr 1fr;
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

interface TxObj {
  timeStamp: number
  hash: string
  method: string
  amount: BigNumber
  token: string
  from?: string
  to?: string
  harvestAmount?: BigNumber // if it's withdrawing tx
}

const FarmHistoryModal = ({ farms }: { farms: Farm[] }) => {
  const farmHistoryModalOpen = useModalOpen(ApplicationModal.FARM_HISTORY)
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const { library, account, chainId } = useActiveWeb3React()
  const [txs, setTxs] = useState<Array<TxObj>>([])
  const [isLoading, setIsLoading] = useState(false)

  const masterChefAddress = useMemo(() => (chainId ? MASTERCHEF_ADDRESS[chainId].toLocaleLowerCase() : ''), [chainId])
  const rewardLockedAddress = useMemo(() => (chainId ? REWARD_LOCKER_ADDRESS[chainId].toLocaleLowerCase() : ''), [
    chainId
  ])

  useEffect(() => {
    if (account && farmHistoryModalOpen) {
      getTransactions()
    }
  }, [farmHistoryModalOpen])

  const getTransactions = useCallback(
    async (startBlockNumber?: number) => {
      if (library && chainId) {
        const currentBlock = library.blockNumber
        setIsLoading(true)
        fetch(
          `${ETHERSCAN_API[chainId]}/api?module=account&action=txlist&address=${account}&startblock=${startBlockNumber}&endblock=${currentBlock}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
        )
          .then(res => res.json())
          .then(data => {
            if (data.status === '1') {
              const filteredTxs = data.result.filter((tx: { to: string }) => {
                return tx.to === masterChefAddress || tx.to === rewardLockedAddress
              })
              return Promise.all(filterFarmTxs(filteredTxs))
            }
            return Promise.resolve([])
          })
          .then(txs => {
            setTxs(txs)
            setIsLoading(false)
          })
      }
    },
    [library, chainId]
  )

  const filterFarmTxs = useCallback(
    (txs: Array<TxObj>): Promise<TxObj>[] => {
      if (library && chainId) {
        return txs.map(tx => {
          return new Promise((res, rej) => {
            library
              .getTransactionReceipt(tx.hash)
              .then((txReceipt: any) => {
                const txData = getTxData(txReceipt, chainId)
                res({
                  timeStamp: tx.timeStamp,
                  hash: tx.hash,
                  method: txData.method,
                  amount: txData.amount,
                  token: txData.token,
                  harvestAmount: txData.harvestAmount
                })
              })
              .catch(e => rej(e))
          })
        })
      }
      return []
    },
    [library, chainId]
  )

  const getTxData = useCallback((txReceipt: any, chainId: ChainId) => {
    let method = ''
    let tokenDeposit = ''
    let amount = BigNumber.from(0)
    let harvestAmount = BigNumber.from(0)
    let withdrawAmount = BigNumber.from(0)
    let tokenWithdraw = ''
    for (const log of txReceipt.logs) {
      for (const topic of log.topics) {
        if (topic === FARM_TRANSFER_TOKEN_TOPIC[chainId]) {
          tokenDeposit = log.address
          if (log.address !== REWARD_LOCKER_ADDRESS[chainId]) {
            tokenWithdraw = log.address
            withdrawAmount = BigNumber.from(log.data)
          }
        }
        if (topic === FARM_DEPOSIT_TOPIC[chainId]) {
          method = 'DEPOSIT'
        }
        if (topic === FARM_HARVEST_TOPIC[chainId]) {
          method = 'HARVEST'
          harvestAmount = harvestAmount.add(BigNumber.from(log.data))
        }
        if (topic === FARM_WITHDRAW_TOPIC[chainId]) {
          method = 'WITHDRAW'
        }
        if (topic === FARM_CLAIM_TOPIC[chainId]) {
          method = 'CLAIM'
        }
      }
      if (method) {
        if (method === 'CLAIM') {
          amount = BigNumber.from(log.data.slice(0, 66)) // first 8 bytes for first param
        } else if (method === 'WITHDRAW') {
          amount = withdrawAmount
        } else if (method === 'HARVEST'){
          amount = harvestAmount
        } else {
          amount = BigNumber.from(log.data)
        }
      }
    }
    return {
      method: method,
      amount: amount,
      token: method === 'DEPOSIT' ? tokenDeposit : tokenWithdraw,
      harvestAmount: harvestAmount
    }
  }, [])

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

  return (
    <Modal isOpen={farmHistoryModalOpen} onDismiss={toggleFarmHistoryModal} maxHeight="fit-content" maxWidth="570px">
      <Wrapper>
        <Box overflow="hidden"  height="100%">
          <Text className="title">Histories</Text>
          {isLoading && (
            <Text textAlign="center" mt="3" fontSize="12px">
              <Dots />
            </Text>
          )}
          {!isLoading && txs.length === 0 && (
            <Text textAlign="center" mt="3" fontSize="12px">
              No records found.
            </Text>
          )}
          <ScrollAble>
            {txs.map(tx => (
              <Fragment key={tx.timeStamp}>
                <Row>
                  <Text fontSize="14px">{new Date(tx.timeStamp * 1000).toLocaleString()}</Text>
                  <Text className="break-word" fontSize="14px">
                    <Text mr={1} display="inline">
                      {getFullDisplayBalance(tx.amount, undefined, 3)}
                    </Text>
                    {(() => {
                      const farm = tokenToFarm(tx.token)
                      return farm ? <TokenSymbol farm={farm} /> : 'KNC'
                    })()}
                  </Text>
                  <Text fontSize="12px" textAlign="right">{tx.method}</Text>
                </Row>
                {tx.method === 'WITHDRAW' && tx.harvestAmount && !tx.harvestAmount.isZero() && (
                  <Row>
                    <div></div>
                    <Text className="break-word" fontSize="14px">
                      <Text mr={1} display="inline">
                        {getFullDisplayBalance(tx.harvestAmount, undefined, 3)}
                      </Text>
                      KNC
                    </Text>
                    <Text fontSize="12px" textAlign="right">HARVEST</Text>
                  </Row>
                )}
              </Fragment>
            ))}
          </ScrollAble>
        </Box>
      </Wrapper>
    </Modal>
  )
}

const TokenSymbol = ({ farm }: { farm: Farm }) => {
  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token
  return (
    <span>
      {currency0.symbol}-{currency1.symbol} LP
    </span>
  )
}

export default FarmHistoryModal

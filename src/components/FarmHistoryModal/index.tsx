import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useFarmHistoryModalToggle } from 'state/application/hooks'
import styled from 'styled-components'
import { Text } from 'rebass'
import { useActiveWeb3React } from 'hooks'
import {
  MASTERCHEF_ADDRESS,
  REWARD_LOCKER_ADDRESS,
  FARM_DEPOSIT_TOPIC,
  FARM_HARVEST_TOPIC,
  FARM_CLAIM_TOPIC,
  FARM_TRANSFER_TOKEN_TOPIC,
  ETHERSCAN_API,
  ETHERSCAN_API_KEY
} from 'constants/index'
import { BigNumber } from '@ethersproject/bignumber'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { ChainId, Token } from 'libs/sdk/src'
import { Farm } from 'state/farms/types'
import { useToken } from 'hooks/Tokens'
import { Dots } from 'components/swap/styleds'

const Wrapper = styled.div`
  width: 100%;
  padding: 28px 34px 100px;
  color: #f4f4f4;
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
  margin-top: 15px;
`
interface TxObj {
  timeStamp: number
  hash: string
  method: string
  amount: BigNumber
  token: string
  from?: string
  to?: string
}

const FarmHistoryModal = ({ farms }: { farms: Farm[] }) => {
  const farmHistoryModalOpen = useModalOpen(ApplicationModal.FARM_HISTORY)
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const { library, account, chainId } = useActiveWeb3React()
  const [txs, setTxs] = useState<Array<TxObj>>([])
  const [isLoading, setIsLoading] = useState(false)

  const masterChefAddress = useMemo(() => (chainId ? MASTERCHEF_ADDRESS[chainId].toLocaleLowerCase() : ''), [chainId])
  const rewardLockedAddress = useMemo(() => (chainId ? REWARD_LOCKER_ADDRESS[chainId].toLocaleLowerCase() : ''), [
    chainId,
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
          .then((res) => res.json())
          .then((data) => {
            if (data.status === '1') {
              const filteredTxs = data.result.filter((tx: { to: string }) => {
                return tx.to === masterChefAddress || tx.to === rewardLockedAddress
              })
              return Promise.all(filterFarmTxs(filteredTxs))
            }
            return Promise.resolve([])
          })
          .then((txs) => {
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
        return txs.map((tx) => {
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
                })
              })
              .catch((e) => rej(e))
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
    for (const log of txReceipt.logs) {
      for (const topic of log.topics) {
        if (topic === FARM_TRANSFER_TOKEN_TOPIC[chainId]) {
          tokenDeposit = log.address
        }
        switch (topic) {
          case FARM_DEPOSIT_TOPIC[chainId]:
            method = 'DEPOSIT'
            break
          case FARM_HARVEST_TOPIC[chainId]:
            method = 'HARVEST'
            break
          case FARM_CLAIM_TOPIC[chainId]:
            method = 'CLAIM'
            break
          default:
            break
        }
        if (method) break
      }
      if (method) {
        amount = BigNumber.from(log.data)
        if (method === 'CLAIM') {
          amount = BigNumber.from(log.data.slice(0, 66)) // first 8 bytes for first param
        }
        break
      }
    }
    return {
      method: method,
      amount: amount,
      token: tokenDeposit,
    }
  }, [])

  const tokenToFarm = useCallback(
    (id: string) => {
      const index = farms.findIndex((farm) => {
        return farm.id === id.toLocaleLowerCase()
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
        {txs.map((tx) => (
          <Row key={tx.timeStamp}>
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
            <Text fontSize="12px">{tx.method}</Text>
          </Row>
        ))}
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

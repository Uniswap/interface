import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import React, { useRef, useState } from 'react'
import { CheckCircle, Copy, ExternalLink, Info, X } from 'react-feather'
import { useSelector } from 'react-redux'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'
import useSWR from 'swr'

import Modal from 'components/Modal'
import { CAMPAIGN_YOUR_TRANSACTIONS_ITEM_PER_PAGE, SWR_KEYS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleYourCampaignTransactionsModal } from 'state/application/hooks'
import { CampaignProofData } from 'state/campaigns/actions'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

export default function YourCampaignTransactionsModal() {
  const theme = useTheme()
  const isYourCampaignTransactionModalOpen = useModalOpen(ApplicationModal.YOUR_CAMPAIGN_TRANSACTIONS)
  const toggleYourCampaignTransactionModal = useToggleYourCampaignTransactionsModal()

  const { account } = useActiveWeb3React()
  const [currentPage] = useState(1)

  const above768 = useMedia('(min-width: 768px)')

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const { data: userCampaignTransactions } = useSWR<CampaignProofData[]>(
    account && selectedCampaign
      ? SWR_KEYS.getCampaignTransactions(
          selectedCampaign.id,
          CAMPAIGN_YOUR_TRANSACTIONS_ITEM_PER_PAGE,
          CAMPAIGN_YOUR_TRANSACTIONS_ITEM_PER_PAGE * (currentPage - 1),
          account,
        )
      : null,
    async (url: string) => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data && Array.isArray(data.data) && data.data.length) {
            return data.data.map(
              (item: any): CampaignProofData => ({
                id: item.id,
                chainId: parseInt(item.chainId),
                utcTimestamp: new Date(item.time).getTime(),
                txPoint: item.txPoint,
                txHash: item.tx,
              }),
            )
          }
        }
        return []
      } catch (err) {
        console.error(err)
      }
    },
  )

  const [isCopied, setCopied] = useCopyClipboard()
  const copiedText = useRef<string>()

  return (
    <Modal isOpen={isYourCampaignTransactionModalOpen} onDismiss={toggleYourCampaignTransactionModal} maxWidth={900}>
      <ModalContent>
        <Flex justifyContent="space-between" alignItems="center" width="100%">
          <Title>
            <Trans>Your Transactions ({userCampaignTransactions ? userCampaignTransactions.length : 0})</Trans>
          </Title>
          <X
            color={theme.subText}
            size={24}
            onClick={toggleYourCampaignTransactionModal}
            style={{ cursor: 'pointer' }}
          />
        </Flex>
        <TableWrapper>
          <TableHeader>
            <TableHeaderItem>#</TableHeaderItem>
            <TableHeaderItem>
              <Trans>Txn Hash</Trans>
            </TableHeaderItem>
            <TableHeaderItem style={{ textAlign: above768 ? 'left' : 'center' }}>
              <Trans>Local Time</Trans>
            </TableHeaderItem>
            <TableHeaderItem style={{ textAlign: 'right' }}>
              <Trans>Points</Trans>
            </TableHeaderItem>
          </TableHeader>
          <TableBodyWrapper>
            {userCampaignTransactions && userCampaignTransactions.length === 0 && (
              <Flex
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: '20vh', padding: '0 8px' }}
              >
                <Info size={48} color={theme.subText} style={{ margin: '16px 0' }} />
                <Text as="span" textAlign="center">
                  <Trans>You haven&apos;t made any eligible transactions yet.</Trans>
                </Text>
                <Text as="span" textAlign="center" mt="8px">
                  <Trans>Read the rules for this campaign & start swapping!</Trans>
                </Text>
              </Flex>
            )}
            {userCampaignTransactions &&
              userCampaignTransactions.map((ct, index) => (
                <TableBody key={ct.id}>
                  <TableBodyItem>{index + 1}</TableBodyItem>
                  <TableBodyItem
                    role="button"
                    onClick={() => {
                      setCopied(ct.txHash)
                      copiedText.current = ct.txHash
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={NETWORKS_INFO[ct.chainId].icon} alt="Network" style={{ width: '16px' }} />
                    <div>{getShortenAddress(ct.txHash)}</div>
                    {above768 && (
                      <>
                        {isCopied && copiedText.current === ct.txHash ? (
                          <CheckCircle size="14" color={theme.subText} />
                        ) : (
                          <Copy size="14" color={theme.subText} />
                        )}
                      </>
                    )}

                    <ExternalLink
                      size="14"
                      color={theme.subText}
                      onClick={e => {
                        e.stopPropagation()
                        window.open(getEtherscanLink(ct.chainId, ct.txHash, 'transaction'), '_blank')
                      }}
                    />
                  </TableBodyItem>
                  <TableBodyItem style={{ flexDirection: above768 ? 'row' : 'column' }}>
                    <span>{dayjs(ct.utcTimestamp).format('DD/MM/YYYY')}</span>{' '}
                    <span style={{ color: theme.subText }}>{dayjs(ct.utcTimestamp).format('(hh:mm:ss A)')}</span>
                  </TableBodyItem>
                  <TableBodyItem style={{ justifyContent: 'flex-end' }}>+{ct.txPoint}</TableBodyItem>
                </TableBody>
              ))}
          </TableBodyWrapper>
        </TableWrapper>
      </ModalContent>
    </Modal>
  )
}

const ModalContent = styled(Flex)`
  flex-direction: column;
  gap: 16px;
  padding: 26px 20px 20px;
  width: 100%;
  background: ${({ theme }) => theme.tableHeader};
`

const Title = styled(Text)`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      font-size: 16px;
      line-height: 20px;
    `}`}
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 32px 2fr 2fr 1fr;
  padding: 16px 20px;
  background: ${({ theme }) => theme.background};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      border-radius: 0;
      padding: 16px;
      grid-template-columns: 16px 2fr 2fr 1fr;
    `}`}
`

const TableHeaderItem = styled.div`
  text-transform: uppercase;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TableBody = styled.div`
  display: grid;
  grid-template-columns: 32px 2fr 2fr 1fr;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      padding: 16px;
      grid-template-columns: 16px 2fr 2fr 1fr;
    `}`}
`

const TableBodyItem = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 6px;

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      gap: 4px;
    `}`}
`

const TableWrapper = styled.div`
  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      margin: 0 -20px;
    `}`}
`

const TableBodyWrapper = styled.div`
  overflow: auto;
  max-height: 50vh;

  &:hover {
    ::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.disableText};
      border-radius: 999px;
    }
  }

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.tableHeader};
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
  }
`

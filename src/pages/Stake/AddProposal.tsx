import { useCelo } from '@celo/react-celo'
import { ChainId } from '@ubeswap/sdk'
import { ButtonError } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { ProposalTabs } from 'components/NavigationTabs'
import { RowBetween } from 'components/Row'
import AddCommandModal from 'components/Stake/AddCommandModal'
import { useDoTransaction } from 'components/swap/routing'
import { Wrapper } from 'components/swap/styleds'
import { BytesLike, Interface } from 'ethers/lib/utils'
import { useRomulusDelegateContract } from 'hooks/useContract'
import AppBody from 'pages/AppBody'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { TrashIcon } from 'theme'

import { ubeGovernanceAddresses } from '../../constants'

const CommandCard = styled(RowBetween)`
cursor: 'pointer';
font-size: 13px;
font-weight: 400;
padding: 0.75rem 1rem;
margin: 0.5rem 0 0 0;
border: ${({ theme }) => `1px solid ${theme.primary5}`};
border-radius: 8px;
&:hover {
  ${({ theme }) => `box-shadow: 0px 2px 10px 1px ${theme.primary5};`}
`

export const Textarea = styled.textarea`
  position: relative;
  display: flex;
  padding: 12px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.text1};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3};
  -webkit-appearance: none;
  min-height: 200px;
  font-size: 14px;

  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    outline: none;
  }
`

export interface Command {
  target: string
  abi: Interface
  value: string
  signature: string
  args: unknown[]
}

export default function AddProposal() {
  const { t } = useTranslation()

  const { network } = useCelo()
  const [commands, setCommands] = useState<Command[]>([])
  const [calldatas, setCalldatas] = useState<BytesLike[]>([])
  const [description, setDescription] = useState<string>('')
  const [showAddCommandModal, setShowAddCommandModal] = useState(false)
  const [error, setError] = useState<string | undefined>('Create')
  const [currentId, setCurrentId] = useState<number>(-1)

  const romulusAddress = ubeGovernanceAddresses[network.chainId as ChainId]
  const c = useRomulusDelegateContract(romulusAddress)
  const doTransaction = useDoTransaction()

  const history = useHistory()
  const goBack = useCallback(() => {
    history.push(`/stake`)
  }, [history])

  const onAddCommand = (command: Command, calldata: BytesLike) => {
    console.log(command)
    setCommands([...commands, command])
    setCalldatas([...calldatas, calldata])
  }

  const onUpdateCommand = (command: Command, calldata: BytesLike) => {
    const _commands = [...commands]
    const _calldatas = [...calldatas]
    _commands[currentId] = command
    _calldatas[currentId] = calldata
    setCommands(_commands)
    setCalldatas(_calldatas)
  }

  const editCommand = (idx: number) => {
    setCurrentId(idx)
    setShowAddCommandModal(true)
  }

  const removeCommand = (idx: number) => {
    const _commands = [...commands]
    const _calldatas = [...calldatas]
    _commands.splice(idx, 1)
    _calldatas.splice(idx, 1)
    setCommands(_commands)
    setCalldatas(_calldatas)
  }

  const onConfirm = useCallback(async () => {
    if (c) {
      const targets = commands.map((command) => command.target)
      const values = commands.map((command) => command.value)
      const signatures = commands.map((command) => command.signature)
      await doTransaction(c, 'propose', {
        args: [targets, values, signatures, calldatas, description],
        summary: `Create a proposal`,
      })
    }
    goBack()
  }, [c, goBack, commands, doTransaction, calldatas, description])

  useEffect(() => {
    if (description.length === 0) {
      setError(t('Create'))
    } else {
      setError(undefined)
    }
  }, [description.length, t])

  return (
    <AppBody>
      <AddCommandModal
        isOpen={showAddCommandModal}
        defaultCommand={currentId !== -1 ? commands[currentId] : undefined}
        onDismiss={() => {
          setCurrentId(-1)
          setShowAddCommandModal(false)
        }}
        onConfirm={(command, calldata) => {
          if (currentId === -1) {
            onAddCommand(command, calldata)
          } else {
            onUpdateCommand(command, calldata)
          }
          setCurrentId(-1)
          setShowAddCommandModal(false)
        }}
      />
      <ProposalTabs />
      <Wrapper>
        <AutoColumn gap="20px">
          <Box>
            <RowBetween mt={2}>
              <Text fontWeight={500}>Commands</Text>
              <ButtonError
                padding={'0.2rem 1.5rem'}
                width={'unset'}
                onClick={() => {
                  setCurrentId(-1)
                  setShowAddCommandModal(true)
                }}
              >
                Add
              </ButtonError>
            </RowBetween>
            <Flex flexDirection={'column'}>
              {commands.map((command, idx) => (
                <CommandCard key={idx} onClick={() => editCommand(idx)}>
                  <Text fontStyle={'italic'}>{command.signature}</Text>
                  <Box>
                    <TrashIcon
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCommand(idx)
                      }}
                    />
                  </Box>
                </CommandCard>
              ))}
            </Flex>
          </Box>
          <Box mb={3}>
            <Text fontWeight={500}>Proposal description</Text>
            <Textarea
              placeholder="Enter details about your proposal"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              style={{ marginTop: '8px' }}
            />
          </Box>
        </AutoColumn>
        <ButtonError disabled={!!error} onClick={onConfirm}>
          {error ? error : 'Create'}
        </ButtonError>
      </Wrapper>
    </AppBody>
  )
}

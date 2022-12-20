/* eslint-disable react-hooks/exhaustive-deps */
import { ButtonError } from 'components/Button'
import { BigNumberish } from 'ethers'
import { BytesLike, FunctionFragment, getAddress, Interface, parseEther } from 'ethers/lib/utils'
import { useFormik } from 'formik'
import { useAbi } from 'hooks/useAbi'
import { Command } from 'pages/Stake/AddProposal'
import React, { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { Card, Flex, Input, Select, Textarea } from 'theme-ui'

import { CloseIcon } from '../../theme'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import { FunctionWithArgs } from './FunctionWithArgs'
import { TransactionDataBuilder } from './TransactionDataBuilder'

interface ContractCall {
  /**
   * Target contract address.
   */
  target: string
  /**
   * Call value
   */
  value: BigNumberish
  /**
   * Call method signature
   */
  signature: string
  /**
   * Unencoded function args
   */
  args: unknown[]
}

type Form = Omit<{ [key in keyof ContractCall]: string }, 'args'> & {
  args: unknown[]
}

const initialFormValues = {
  target: '',
  value: '',
  signature: '',
  args: [],
}

interface AddCommandModalProps {
  isOpen: boolean
  defaultCommand?: Command
  onConfirm: (command: Command, calldata: BytesLike) => void
  onDismiss: () => void
}

export default function AddCommandModal({ isOpen, defaultCommand, onConfirm, onDismiss }: AddCommandModalProps) {
  const [error, setError] = useState<string | undefined>('')

  const [functionFragment, setFunctionFragment] = useState<FunctionFragment | undefined>(undefined)
  const [abi, setAbi] = useState<Interface | null>(defaultCommand ? defaultCommand.abi : null)
  const [init, setInit] = useState(true)

  const formik = useFormik<Form>({
    initialValues: defaultCommand ? { ...defaultCommand } : initialFormValues,
    validate: (values) => {
      const errors: { [key in keyof ContractCall]?: string } = {}
      try {
        getAddress(values.target)
      } catch (e) {
        if (values.target) {
          errors.target = 'Invalid address'
        }
      }

      if (values.value) {
        try {
          parseEther(values.value.toString())
        } catch (e) {
          errors.value = 'Invalid value'
        }
      } else {
        errors.value = 'Value is required'
      }

      if (!values.signature) {
        errors.signature = 'Method signature is required'
      }

      try {
        const fragment = abi?.functions[values.signature]
        const { args } = values
        if (fragment) {
          abi?.encodeFunctionData(fragment, args ?? fragment.inputs.map(() => undefined))
        }
      } catch (e) {
        errors.args = 'Enter the correct arguments'
      }
      return errors
    },
    onSubmit: () => {
      handleSubmit()
    },
  })

  const handleSubmit = () => {
    const { values } = formik
    if (!abi) {
      throw new Error('no abi')
    } else {
      const fragment = abi.functions[values.signature]
      if (!fragment) {
        throw new Error('unknown fragment: ' + values.signature)
      }
      const { args } = values
      const data = abi?.encodeFunctionData(fragment, args ?? fragment.inputs.map(() => undefined))
      setAbi(null)
      formik.resetForm()
      onConfirm(
        {
          target: formik.values.target,
          abi,
          value: formik.values.value || '0',
          signature: formik.values.signature,
          args,
        },
        data
      )
    }
  }

  const dynamicAbi = useAbi(formik.values.target)
  useEffect(() => {
    setAbi(dynamicAbi)
  }, [dynamicAbi])

  useEffect(() => {
    if (!abi) {
      setError('ABI is required')
      if (init) {
        formik.values.value = initialFormValues.value
        formik.values.signature = initialFormValues.signature
        formik.values.args = initialFormValues.args
      }
    } else {
      if (!init) {
        formik.values.value = initialFormValues.value
        formik.values.signature = initialFormValues.signature
        formik.values.args = initialFormValues.args
      }
      setError('')
      setInit(false)
    }
  }, [abi])

  useEffect(() => {
    if (!init) {
      formik.values.value = initialFormValues.value
      formik.values.signature = initialFormValues.signature
      formik.values.args = initialFormValues.args
    }
  }, [formik.values.target])

  useEffect(() => {
    setFunctionFragment(abi?.functions[formik.values.signature])
  }, [abi, formik.values.signature])

  useEffect(() => {
    if (!init) {
      formik.values.args = initialFormValues.args
    }
  }, [formik.values.signature])

  useEffect(() => {
    setInit(true)
    formik.resetForm()
    if (defaultCommand) {
      formik.values.target = defaultCommand.target
      formik.values.value = defaultCommand.value
      formik.values.signature = defaultCommand.signature
      formik.values.args = defaultCommand.args
      setFunctionFragment(defaultCommand.abi?.functions[defaultCommand.signature])
    } else {
      formik.values.target = initialFormValues.target
      formik.values.value = initialFormValues.value
      formik.values.signature = initialFormValues.signature
      formik.values.args = initialFormValues.args
      setFunctionFragment(undefined)
    }
  }, [defaultCommand])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <ContentWrapper gap={'12px'}>
        <AutoColumn gap="12px">
          <RowBetween>
            <Text fontWeight={500} fontSize={18}>
              Add Command
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        </AutoColumn>
        <Form onSubmit={formik.handleSubmit}>
          <FormContentWrapper>
            <Text fontWeight={500}>Target</Text>
            <StyledInput
              id="target"
              name="target"
              type="text"
              onChange={formik.handleChange}
              value={formik.values.target}
              placeholder="Enter contract address"
            />
            {formik.touched.target && formik.errors.target && <ErrorMessage>{formik.errors.target}</ErrorMessage>}
            <Text fontWeight={500}>ABI</Text>
            <StyledTextarea
              id="abi"
              name="abi"
              placeholder="Paste ABI"
              onChange={(e) => {
                setAbi(new Interface(e.target.value))
              }}
              value={abi ? JSON.stringify(abi.fragments, null, 2) : ''}
            />
            {abi ? (
              <>
                <Text fontWeight={500}>Value</Text>
                <StyledInput
                  id="value"
                  name="value"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.value}
                  placeholder="0.0"
                />
                {formik.touched.value && formik.errors.value && <ErrorMessage>{formik.errors.value}</ErrorMessage>}
                <Text fontWeight={500}>Method signature</Text>
                <StyledSelect
                  id="signature"
                  name="signature"
                  onChange={formik.handleChange}
                  value={formik.values.signature}
                >
                  <StyledOption value={''}>Select a signature</StyledOption>
                  {Object.entries(abi.functions).map(([signature, fragment]) => (
                    <StyledOption key={signature} value={signature}>
                      {fragment.format('sighash')}
                    </StyledOption>
                  ))}
                </StyledSelect>
                {formik.touched.signature && formik.errors.signature && (
                  <ErrorMessage>{formik.errors.signature}</ErrorMessage>
                )}
              </>
            ) : null}
            {formik.values.signature && abi && functionFragment ? (
              <>
                <Text fontWeight={500}>Arguments</Text>
                <TransactionDataBuilder
                  method={functionFragment}
                  args={formik.values.args}
                  onChange={(value) => formik.setFieldValue('args', value)}
                />
                {formik.touched.args && formik.errors.args && <ErrorMessage>{formik.errors.args}</ErrorMessage>}
              </>
            ) : null}

            {functionFragment && (
              <PreviewWrapper>
                <Text fontWeight={500}>Preview</Text>
                <PreviewCard p={[1, 2]}>
                  <FunctionWithArgs frag={functionFragment} args={formik.values.args} />
                </PreviewCard>
              </PreviewWrapper>
            )}
          </FormContentWrapper>
          <Flex sx={{ justifyContent: 'center' }}>
            <ButtonError disabled={!!error} type="submit">
              {error ? error : defaultCommand ? 'Update Command' : 'Add Command'}
            </ButtonError>
          </Flex>
        </Form>
      </ContentWrapper>
    </Modal>
  )
}

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

const PreviewWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 12px;
  padding: 8px;
`

const PreviewCard = styled(Card)`
  font-style: italic;
  font-size: 14px;
`

const FormContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 16px;
`

const ErrorMessage = styled.div`
  color: red;
  font-size: 14px;
  font-style: italic;
  margin-top: -8px;
`

const Form = styled.form`
  display: grid;
  grid-row-gap: 16px;
  max-height: calc(90vh - 70px);
`

export const StyledInput = styled(Input)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.text1} !important;
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3} !important;
  -webkit-appearance: none;
  font-size: 14px !important;

  ::placeholder {
    color: ${({ theme }) => theme.text3} !important;
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1} !important;
    outline: none;
  }
`

export const StyledSelect = styled(Select)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.text1} !important;
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3} !important;
  -webkit-appearance: none;
  font-size: 14px !important;
  font-family: inherit;

  ::placeholder {
    color: ${({ theme }) => theme.text3} !important;
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1} !important;
    outline: none;
  }
`

export const StyledOption = styled.option`
  color: #000000;
`

export const StyledTextarea = styled(Textarea)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.text1} !important;
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3} !important;
  -webkit-appearance: none;
  min-height: 200px;
  font-size: 14px !important;
  resize: none;

  ::placeholder {
    color: ${({ theme }) => theme.text3} !important;
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1} !important;
    outline: none;
  }
`

import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import {
  ParameterState,
  setEncryptionParam,
  setEncryptionProverKey,
  setEncryptionVerifierData,
  setVdfParam,
  setVdfSnarkParam,
  setZkpParameters,
  VdfParam,
} from './reducer'

export function useVdfParam(): VdfParam | null {
  return useAppSelector((state) => state.parameters.vdfParam)
}

export function useVdfSnarkParam(): string {
  return useAppSelector((state) => state.parameters.vdfSnarkParam)
}

export function useEncryptionParam(): string {
  return useAppSelector((state) => state.parameters.encryptionParam)
}

export function useEncryptionProverKey(): string {
  return useAppSelector((state) => state.parameters.encryptionProverKey)
}

export function useEncryptionVerifierData(): string {
  return useAppSelector((state) => state.parameters.encryptionVerifierData)
}

export function useParameters(): ParameterState {
  return useAppSelector((state) => state.parameters)
}

export function useVdfParamManager(): [VdfParam | null, (newParam: VdfParam) => void] {
  const dispatch = useAppDispatch()
  const vdfParam = useVdfParam()

  const updateVdfParam = useCallback(
    (newParam: VdfParam) => {
      dispatch(setVdfParam({ newParam }))
    },
    [dispatch]
  )

  return [vdfParam, updateVdfParam]
}

export function useVdfSnarkParamManager(): [string, (newParam: string) => void] {
  const dispatch = useAppDispatch()
  const vdfSnarkParam = useVdfSnarkParam()

  const updateVdfSnarkParam = useCallback(
    (newParam: string) => {
      dispatch(setVdfSnarkParam({ newParam }))
    },
    [dispatch]
  )

  return [vdfSnarkParam, updateVdfSnarkParam]
}

export function useEncryptionParamManager(): [string, (newParam: string) => void] {
  const dispatch = useAppDispatch()
  const encryptionParam = useEncryptionParam()

  const updateEncryptionParam = useCallback(
    (newParam: string) => {
      dispatch(setEncryptionParam({ newParam }))
    },
    [dispatch]
  )

  return [encryptionParam, updateEncryptionParam]
}

export function useEncryptionProverKeyManager(): [string, (newParam: string) => void] {
  const dispatch = useAppDispatch()
  const encryptionProverKey = useEncryptionProverKey()

  const updateEncryptionProverKey = useCallback(
    (newParam: string) => {
      dispatch(setEncryptionProverKey({ newParam }))
    },
    [dispatch]
  )

  return [encryptionProverKey, updateEncryptionProverKey]
}

export function useEncryptionVerifierDataManager(): [string, (newParam: string) => void] {
  const dispatch = useAppDispatch()
  const encryptionVerifierData = useEncryptionVerifierData()

  const updateEncryptionVerifierData = useCallback(
    (newParam: string) => {
      dispatch(setEncryptionVerifierData({ newParam }))
    },
    [dispatch]
  )
  return [encryptionVerifierData, updateEncryptionVerifierData]
}

export function useParametersManager(): [ParameterState, (newParam: ParameterState) => void] {
  const dispatch = useAppDispatch()
  const parameters = useParameters()

  const updateParameters = useCallback(
    (newParam: ParameterState) => {
      dispatch(setZkpParameters({ newParam }))
    },
    [dispatch]
  )

  return [parameters, updateParameters]
}

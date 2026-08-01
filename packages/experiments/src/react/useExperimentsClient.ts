import { useContext } from 'react'
import { type ExperimentsClient, getExperimentsClient } from '../client'
import { ExperimentsClientContext } from './context'

/** Resolve the active experiments client: a provided one, else the shared singleton. */
export function useExperimentsClient(): ExperimentsClient {
  return useContext(ExperimentsClientContext) ?? getExperimentsClient()
}

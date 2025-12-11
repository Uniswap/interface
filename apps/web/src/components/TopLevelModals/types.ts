import { ComponentProps, ComponentType } from 'react'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

type ModalComponent = ComponentType<any>

interface ModalConfig {
  component: ModalComponent
  shouldMount: (state: any) => boolean
  isAlwaysMounted?: boolean
}

export interface ModalWrapperProps {
  Component: ModalComponent
  componentProps?: ComponentProps<ModalComponent>
}

export type ModalRegistry = Partial<Record<ModalNameType, ModalConfig>>

import { MessageSchema } from 'uniswap/src/extension/messagePassing/messageTypes'
import { z } from 'zod'

export enum OnboardingMessageType {
  HighlightOnboardingTab = 'HighlightOnboardingTab',
  SidebarOpened = 'SidebarOpened',
}

export const HighlightOnboardingTabMessageSchema = MessageSchema.extend({
  type: z.literal(OnboardingMessageType.HighlightOnboardingTab),
})
export type HighlightOnboardingTabMessage = z.infer<typeof HighlightOnboardingTabMessageSchema>

export const SidebarOpenedMessageSchema = MessageSchema.extend({
  type: z.literal(OnboardingMessageType.SidebarOpened),
})
export type SidebarOpenedMessage = z.infer<typeof SidebarOpenedMessageSchema>

/* eslint-disable import/no-unused-modules */
import { type InAppNotification } from '@universe/api'
import { create, type StoreApi, type UseBoundStore } from 'zustand'

export interface NotificationState {
  // Currently active notifications
  activeNotifications: InAppNotification[]
  // Add a notification to be rendered
  addNotification: (notification: InAppNotification) => void
  // Remove a notification from the active list
  removeNotification: (notificationId: string) => void
}

export const useNotificationStore: UseBoundStore<StoreApi<NotificationState>> = create<NotificationState>((set) => ({
  activeNotifications: [],

  addNotification: (notification: InAppNotification): void => {
    set((state) => {
      // The NotificationService should prevent duplicates, but we check here defensively just in case.
      const exists = state.activeNotifications.some((n) => n.id === notification.id)
      if (exists) {
        return state
      }

      return {
        activeNotifications: [...state.activeNotifications, notification],
      }
    })
  },

  removeNotification: (notificationId: string): void => {
    set((state) => ({
      activeNotifications: state.activeNotifications.filter((n) => n.id !== notificationId),
    }))
  },
}))

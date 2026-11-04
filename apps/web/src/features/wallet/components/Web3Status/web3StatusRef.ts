import { atom } from 'jotai'
import { RefObject } from 'react'

export const Web3StatusRef = atom<RefObject<HTMLElement | null> | undefined>(undefined)

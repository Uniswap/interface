import { useCallback, useEffect, useState } from 'react'

interface UseEditableFieldOptions<T extends string | number = string | number> {
  value: T
  onChange: (value: T) => void
  focused: boolean
  type?: 'text' | 'number'
  min?: number
  max?: number
  step?: number
  onEditStart?: () => void
  onEditEnd?: () => void
}

interface UseEditableFieldReturn {
  isEditing: boolean
  editValue: string
  startEdit: () => void
  saveEdit: () => void
  cancelEdit: () => void
  handleInput: (input: string, key: { backspace?: boolean; delete?: boolean }) => void
}

/**
 * Hook for managing editable field state and keyboard input
 * Handles edit mode (Enter to edit, Esc to cancel, typing)
 */
export function useEditableField<T extends string | number = string | number>({
  value,
  onChange,
  focused,
  type = 'text',
  min,
  max,
  step: _step = 1,
  onEditStart,
  onEditEnd,
}: UseEditableFieldOptions<T>): UseEditableFieldReturn {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const startEdit = useCallback(() => {
    setIsEditing(true)
    setEditValue(String(value))
    onEditStart?.()
  }, [value, onEditStart])

  const saveEdit = useCallback(() => {
    if (type === 'number') {
      const numValue = Number.parseInt(editValue, 10)
      if (!Number.isNaN(numValue)) {
        const clampedValue = Math.max(min ?? 0, Math.min(max ?? Number.MAX_SAFE_INTEGER, numValue))
        onChange(clampedValue as T)
      }
    } else {
      onChange(editValue as T)
    }
    setIsEditing(false)
    setEditValue('')
    onEditEnd?.()
  }, [editValue, type, min, max, onChange, onEditEnd])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
    onEditEnd?.()
  }, [onEditEnd])

  // Reset editing state when focus is lost
  useEffect(() => {
    if (!focused && isEditing) {
      cancelEdit()
    }
  }, [focused, isEditing, cancelEdit])

  const handleInput = useCallback(
    (input: string, key: { backspace?: boolean; delete?: boolean; return?: boolean; escape?: boolean }) => {
      if (key.return) {
        if (isEditing) {
          saveEdit()
        } else {
          startEdit()
        }
      } else if (key.escape && isEditing) {
        cancelEdit()
      } else if (key.backspace || key.delete) {
        setEditValue((prev) => prev.slice(0, -1))
      } else if (input && input.length === 1) {
        if (type === 'number' && /^\d$/.test(input)) {
          setEditValue((prev) => prev + input)
        } else if (type === 'text') {
          setEditValue((prev) => prev + input)
        }
      }
    },
    [type, isEditing, saveEdit, cancelEdit, startEdit],
  )

  return {
    isEditing,
    editValue,
    startEdit,
    saveEdit,
    cancelEdit,
    handleInput,
  }
}

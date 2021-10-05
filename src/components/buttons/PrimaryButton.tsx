import React from 'react'
import { Button, ButtonProps } from 'src/components/buttons/Button'

export function PrimaryButton(props: ButtonProps) {
  return <Button px="md" py="sm" backgroundColor="green" color="white" {...props} />
}

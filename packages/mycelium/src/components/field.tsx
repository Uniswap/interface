import * as React from 'react'
import { cn } from '../cn'
import { Label } from './label'

/**
 * Vertical label→control stack that owns the 12px gap between a field's caption
 * and its control, so consumers stop re-deciding it per call site.
 *
 * It also provides the `group/field` scope and the `[data-slot=field-label]`
 * marker that `select.tsx` already styles off — those selectors existed with
 * nothing emitting them, so the placeholder treatment they describe was dead.
 */
function Field({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    // oxlint-disable-next-line react/forbid-elements -- layout wrapper, no semantics of its own
    <div data-slot="field" className={cn('group/field flex w-full flex-col gap-3', className)} {...props} />
  )
}

/** Label slot for a Field: mycelium's Label plus the `field-label` marker. */
function FieldLabel({ className, htmlFor, ...props }: React.ComponentProps<typeof Label>): React.JSX.Element {
  // htmlFor is passed explicitly so jsx-a11y/label-has-associated-control can see it through the spread
  return <Label data-slot="field-label" htmlFor={htmlFor} className={cn(className)} {...props} />
}

export { Field, FieldLabel }

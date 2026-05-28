import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'
import { Flex } from './flex'

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>): React.JSX.Element {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn('flex w-full flex-col', className)} {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>): React.JSX.Element {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn(className)} {...props} />
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>): React.JSX.Element {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all duration-80 ease-in-out outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronRight
          data-slot="accordion-trigger-icon"
          className="size-4 shrink-0 text-neutral3 transition-transform duration-200 group-data-[state=open]/accordion-trigger:rotate-90"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>): React.JSX.Element {
  // Skip animation on initial mount, only animate after hydration
  const [shouldAnimate, setShouldAnimate] = React.useState(false)

  React.useEffect(() => {
    // Enable animations after mount (client-side only)
    setShouldAnimate(true)
  }, [])

  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        'overflow-hidden text-sm',
        shouldAnimate && 'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      )}
      {...props}
    >
      <Flex direction="column" className={cn('pb-4 pt-0', className)}>
        {children}
      </Flex>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

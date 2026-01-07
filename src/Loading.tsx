import { cn } from 'hyperparam'
import type { ReactNode } from 'react'

interface LoadingProps {
  className?: string
}

/**
 * Loading component.
 * div style can be overridden by className prop.
 * @param props Component props
 * @param props.className - additional class names to apply to the div
 * @returns ReactNode
 */
export default function Loading({ className }: LoadingProps): ReactNode {
  return <div className={cn('loading', className)}></div>
}

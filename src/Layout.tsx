import { cn, ErrorBar } from 'hyperparam'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
  error?: Error
}

/**
 * Layout for shared UI.
 * Content div style can be overridden by className prop.
 * @param props Component props
 * @param props.children - content to display inside the layout
 * @param props.className - additional class names to apply to the content container
 * @param props.error - error message to display
 * @returns ReactNode
 */
export default function Layout({
  children,
  className,
  error,
}: LayoutProps): ReactNode {
  return (
    <>
      <div className="content-container">
        <div className={cn('content', className)}>{children}</div>
        <ErrorBar error={error} />
      </div>
    </>
  )
}

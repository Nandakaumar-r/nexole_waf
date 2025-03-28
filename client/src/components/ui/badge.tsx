import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-success hover:bg-green-200",
        warning: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200",
        info: "border-transparent bg-blue-100 text-primary hover:bg-blue-200",
        error: "border-transparent bg-red-100 text-error hover:bg-red-200",
        method: {
          GET: "border-transparent bg-green-100 text-success hover:bg-green-200",
          POST: "border-transparent bg-blue-100 text-primary hover:bg-blue-200",
          PUT: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200", 
          DELETE: "border-transparent bg-red-100 text-error hover:bg-red-200",
          PATCH: "border-transparent bg-purple-100 text-purple-700 hover:bg-purple-200",
          default: "border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
        }
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  method?: string;
}

function Badge({ className, variant, size, method, ...props }: BadgeProps) {
  // If method is provided, use it to determine the variant
  let resolvedVariant = variant;
  if (method) {
    switch (method) {
      case 'GET':
      case 'POST':
      case 'PUT':
      case 'DELETE':
      case 'PATCH':
        resolvedVariant = { method: method } as any;
        break;
      default:
        resolvedVariant = { method: 'default' } as any;
    }
  }

  return (
    <div className={cn(badgeVariants({ variant: resolvedVariant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

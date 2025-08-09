import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8",
            className,
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
      </div>
    )
  },
)
Select.displayName = "Select"

// Simple option component
const SelectOption = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, ...props }, ref) => {
    return <option className={cn("", className)} ref={ref} {...props} />
  },
)
SelectOption.displayName = "SelectOption"

// For compatibility with existing code, we'll export these as well
const SelectTrigger = Select
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectItem = SelectOption
const SelectValue = ({ placeholder }: { placeholder?: string }) => null

export { Select, SelectOption, SelectTrigger, SelectContent, SelectItem, SelectValue }

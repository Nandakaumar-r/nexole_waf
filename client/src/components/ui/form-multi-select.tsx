import * as React from "react";
import ReactSelect, { Props as ReactSelectProps } from "react-select";
import { cn } from "@/lib/utils";

export interface FormMultiSelectProps extends Omit<ReactSelectProps, "classNames"> {
  className?: string;
}

// Create a form-compatible MultiSelect component that doesn't need to be wrapped in FormControl
const FormMultiSelect = React.forwardRef<
  HTMLDivElement,
  FormMultiSelectProps
>(({ className, ...props }, ref) => {
  // Create a div reference to forward to
  const divRef = React.useRef<HTMLDivElement>(null);
  
  // Combine the refs
  React.useImperativeHandle(ref, () => divRef.current as HTMLDivElement);

  return (
    <div ref={divRef} className={cn("w-full", className)}>
      <ReactSelect
        {...props}
        isMulti={true}
        classNames={{
          control: (state) => 
            cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
              state.isFocused ? "ring-1 ring-ring" : "",
              state.isDisabled ? "cursor-not-allowed opacity-50" : "",
            ),
          menu: () => "bg-background border border-input rounded-md shadow-md mt-1",
          option: (state) => 
            cn(
              "px-2 py-1.5",
              state.isFocused ? "bg-accent" : "",
              state.isSelected ? "bg-primary text-primary-foreground" : "",
            ),
          multiValue: () => "bg-accent rounded-sm mr-1 px-1",
          multiValueLabel: () => "text-sm",
          multiValueRemove: () => "ml-1 hover:text-destructive",
          placeholder: () => "text-muted-foreground",
        }}
      />
    </div>
  );
});

FormMultiSelect.displayName = "FormMultiSelect";

export { FormMultiSelect };
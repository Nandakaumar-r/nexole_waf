import * as React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormMultiSelect } from "@/components/ui/form-multi-select";
import { Control } from "react-hook-form";

// Country options for multi-select
const countryOptions = [
  { value: 'CN', label: 'China' },
  { value: 'RU', label: 'Russia' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
];

const countryNames: Record<string, string> = {
  CN: 'China',
  RU: 'Russia',
  UA: 'Ukraine',
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
};

interface BlockedCountriesFieldProps {
  control: Control<any>;
  isGeoBlockingEnabled: boolean;
}

export function BlockedCountriesField({ control, isGeoBlockingEnabled }: BlockedCountriesFieldProps) {
  return (
    <FormField
      control={control}
      name="blockedCountries"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Blocked Countries</FormLabel>
          <FormControl>
            <FormMultiSelect
              options={countryOptions}
              value={field.value?.map((code: string) => ({
                value: code,
                label: countryNames[code] || code
              }))}
              onChange={(selected) => {
                const selectedValues = selected ? selected.map((option: any) => option.value) : [];
                field.onChange(selectedValues);
              }}
              placeholder="Select countries to block..."
              isDisabled={!isGeoBlockingEnabled}
            />
          </FormControl>
          <FormDescription>
            Select multiple countries to block traffic from
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
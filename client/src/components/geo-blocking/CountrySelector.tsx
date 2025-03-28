import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// This is a limited list of countries for demonstration purposes
// In a production environment, you would likely use a more complete list
const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "EG", name: "Egypt" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "PK", name: "Pakistan" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

interface CountrySelectorProps {
  onSelect: (country: { code: string; name: string }) => void;
  selectedCountries: string[];
}

export function CountrySelector({ onSelect, selectedCountries }: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCountries.map((countryCode) => {
          const country = countries.find(c => c.code === countryCode);
          return country ? (
            <Badge 
              key={country.code} 
              variant="secondary"
              className="bg-red-100 text-red-800 border-red-300"
            >
              {country.name} ({country.code})
            </Badge>
          ) : null;
        })}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? countries.find((country) => country.code === value)?.name
              : "Select a country..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  onSelect={(currentValue) => {
                    const selectedCountry = countries.find(c => c.code === currentValue);
                    if (selectedCountry) {
                      onSelect(selectedCountry);
                    }
                    setValue("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCountries.includes(country.code) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.name} ({country.code})
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
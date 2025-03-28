#!/bin/bash
sed -i '464,468s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/rules.tsx
sed -i '631,635s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/rules.tsx

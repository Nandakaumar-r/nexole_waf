#!/bin/bash
sed -i '379,385s/                    <FormControl>.*<\/FormControl>/                    <FormCheckbox checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/geo-blocks.tsx
sed -i '479,485s/                    <FormControl>.*<\/FormControl>/                    <FormCheckbox checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/geo-blocks.tsx

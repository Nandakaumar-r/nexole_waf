#!/bin/bash
sed -i '452,458s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx
sed -i '473,478s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx
sed -i '497,502s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx
sed -i '636,642s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx
sed -i '657,662s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx
sed -i '681,686s/                    <FormControl>.*<\/FormControl>/                    <FormSwitch checked={field.value} onCheckedChange={field.onChange} \/>/' client/src/pages/domains.tsx

#!/bin/bash

# Initialize a flag to track if any warnings were encountered
warnings_found=0

# Use find to locate all action.yml files in the .github/actions directory and its subdirectories
while IFS= read -r file; do
    # Check if the file contains an 'inputs:' section
    if grep -q "inputs:" "$file"; then
        # Check if the file contains a step that uses the validate-action-inputs.js script
        if ! grep -q "./scripts/validate-action-inputs.js" "$file"; then
            echo "Warning: $file contains inputs but doesn't use the validate-action-inputs.js script. Please add it and make sure bun install has been run before calling it!"
            warnings_found=1
        fi
    fi
done < <(find .github/actions -name "action.yml")

# Exit with a non-zero status if more than the expected number of warnings are found
if [ $warnings_found -gt 1 ]; then
    exit 1
else
    exit 0
fi

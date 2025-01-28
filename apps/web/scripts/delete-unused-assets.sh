#!/bin/bash

# Array to hold the list of unreferenced files
unreferenced_files=()

# We look for assets in the /src and /public and then, check if they are referenced in
# the code, typically in either /src, /public (manifest.json) or /functions
while IFS= read -r -d $'\0' file; do
    name="$(basename "$file")"
    grep -rn -F -q "$name" ./src ./functions ./public
    if [ $? -ne 0 ]; then
      unreferenced_files+=("$file")
    fi
done < <(find ./src ./public -type f \( -name "*.png" -o -name "*.svg" -o -name "*.jpg" \) -print0)

# If we found any unreferenced files, prompt for deletion
if [ ${#unreferenced_files[@]} -ne 0 ]; then
  echo "Found the following unreferenced files:"
  for file in "${unreferenced_files[@]}"; do
    echo "$file"
  done
  
  read -p "Do you want to delete these files? (y/N) " confirm
  if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "Deleting files..."
    for file in "${unreferenced_files[@]}"; do
      rm "$file"
      echo "Deleted: $file"
    done
    echo "Deletion complete."
    exit 0
  else
    echo "Operation cancelled."
    exit 1
  fi
fi

# If no unreferenced files are found, exit successfully
exit 0

#!/bin/bash
set -euo pipefail

# This script queries NX and then removes local monorepo packages from node_modules

projects=$(bun nx show projects)

while IFS= read -r project; do
  project_path="node_modules/$project"
  echo "Removing $project_path"
  rm -rf "$project_path"
done <<< "$projects"

echo "Done removing local packages from node_modules"

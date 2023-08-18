itemname=$1
file=$2

echo "Attempting to download $file"
read -p 'Ensure you have first run `eval $(op signin)`. Would you like to delete and redownload this file? (Y/n): ' yn

if [[ $yn =~ ^(yes|y|Y|Yes)$ ]]; then
  rm $file
  {
    op document get $itemname --output=$file
  } || {
    echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
  }
else
  echo "Skipping downloading $file"
fi
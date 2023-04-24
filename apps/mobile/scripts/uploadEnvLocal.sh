{
  op document edit "Mobile Repo .env.local" .env.local 
} || {
  echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
}
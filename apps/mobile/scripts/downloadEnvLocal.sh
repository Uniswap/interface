rm .env.defaults.local
{
  op document get "Mobile Repo .env.local" --output=.env.defaults.local 
} || {
  echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
}
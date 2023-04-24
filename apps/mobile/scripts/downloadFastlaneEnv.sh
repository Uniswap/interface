rm ./fastlane/.env.dev
rm ./fastlane/.env.beta
rm ./fastlane/.env.prod
{
  op document get "Mobile Fastlane: .env.dev" --output=./fastlane/.env.dev 
  op document get "Mobile Fastlane: .env.beta" --output=./fastlane/.env.beta
  op document get "Mobile Fastlane: .env.prod" --output=./fastlane/.env.prod  
} || {
  echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
}
{
  op document edit "Mobile Fastlane: .env.dev" ./fastlane/.env.dev 
  op document edit "Mobile Fastlane: .env.beta" ./fastlane/.env.beta
  op document edit "Mobile Fastlane: .env.prod" ./fastlane/.env.prod  
} || {
  echo "Make sure you have the 1Pass CLI installed and that you are logged in. More info: https://developer.1password.com/docs/cli/get-started#install"
}
import development from "./development.config";
import production from "./production.config";
require("dotenv").config();

const env = process.env.REACT_APP_APP_ENV || process.env.NODE_ENV || 'development';

const config = {
  development,
  production
};

export default config[env];

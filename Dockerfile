FROM node:14.21-buster-slim as build-app
RUN apt-get update && apt-get install -y git
ARG REACT_APP_AMPLITUDE_PROXY_URL
ARG REACT_APP_AWS_API_ENDPOINT
ARG REACT_APP_FORTMATIC_KEY
ARG REACT_APP_INFURA_KEY
ARG REACT_APP_MOONPAY_API
ARG REACT_APP_MOONPAY_LINK
ARG REACT_APP_MOONPAY_PUBLISHABLE_KEY
ARG REACT_APP_FIREBASE_KEY
ARG THE_GRAPH_SCHEMA_ENDPOINT
ARG REACT_APP_SENTRY_ENABLED
WORKDIR /goerliswap-dapp
ENV PATH /goerliswap-dapp/node_modules/.bin:$PATH
COPY . ./
RUN yarn
RUN yarn build

FROM nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-app /goerliswap-dapp/build /usr/share/nginx/html
EXPOSE 80
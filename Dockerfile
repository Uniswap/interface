FROM node:12 AS build
ARG CURRENT_BRANCH
ARG REACT_APP_NETWORK_URL
ARG REACT_APP_PORTIS_ID
ARG REACT_APP_FORTMATIC_KEY
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json yarn.lock ./
# RUN npm install -g yarn
RUN yarn install --silent
COPY . .
ENV CURRENT_BRANCH $CURRENT_BRANCH
ENV NODE_ENV production
ENV REACT_APP_CHAIN_ID 1
RUN npm run build

# production environment
FROM nginx:latest
COPY ./devops/conf/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
RUN ls /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

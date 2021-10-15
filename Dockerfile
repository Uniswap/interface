# Multi-stage
# 1) Node image for building frontend assets
# 2) nginx stage to serve frontend assets

FROM node:alpine AS builder
WORKDIR /app
RUN apk update && \
    apk add git
COPY . .
RUN yarn install && yarn build

# nginx state for serving content
FROM nginx:alpine
COPY --from=builder /app/build /var/www
COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]

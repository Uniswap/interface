FROM node:14 AS build
WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

FROM node:14-alpine
WORKDIR /app

COPY --from=build /app/build ./build

RUN yarn global add serve

EXPOSE 3000

CMD ["serve", "build", "-l", "3000"]

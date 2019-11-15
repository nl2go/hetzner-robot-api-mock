ARG NODE_VERSION=13.1.0

FROM node:$NODE_VERSION-alpine

LABEL MAINTAINER=<ops@newsletter2go.com>

COPY ./src/ /app/src
COPY ./test/ /app/test
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

WORKDIR /app

RUN npm install \
  && npm test \
  && npm prune --production

EXPOSE 3000

WORKDIR /app/src

CMD ["node", "index.js"]

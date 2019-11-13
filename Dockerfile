ARG JSON_SERVER_VERSION=0.15.1

FROM nl2go/json-server:$JSON_SERVER_VERSION

LABEL MAINTAINER=<ops@newsletter2go.com>

ENV NODE_PATH=/usr/local/lib/node_modules

COPY .docker/ /

WORKDIR /app

RUN npm install --save body-parser@1.19.0

EXPOSE 3000

CMD ["node", "server.js"]

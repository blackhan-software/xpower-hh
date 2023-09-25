FROM node:lts-bullseye-slim

ENV VERSION v9.0.0
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y \
    git \
    procps \
    cron \
    apt-utils && \
    apt-get upgrade -y

RUN git clone --depth 1 --branch ${VERSION} \
    https://github.com/blackhan-software/xpower-hh.git /opt/xpower-hh

WORKDIR /opt/xpower-hh

RUN npm install && \
    npm run build && \
    cp .env-avalanche-main .env

COPY docker/start-miner.sh .
COPY docker/restart-miner.cron /etc/cron.d/restart-miner

CMD [ "/bin/bash", "./start-miner.sh" ]

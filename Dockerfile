# base image
FROM mhart/alpine-node:latest

# labels
LABEL maintainer "Leandro Santiago Gomes <leandroluk@gmail.com>" 

ARG PROXY
ARG LOG_FILE

# env variables
ENV TZ       = America/Sao_Paulo \
    NODE_ENV = prod              \
    PORT     = 3000              \
    PROXY    = ${PROXY}          \
    LOG_FILE = ${LOG_FILE}       \
    WORKDIR  = /opt/crawler-ml

# set root path
WORKDIR ${WORKDIR}

# copy container files
COPY package.json package-lock.json /src ${WORKDIR}

# install & tree-shacking deps
RUN npm ci --prod

# expose port to make acessible
EXPOSE ${PORT}

# run project
CMD node --no-warnings ${WORKDIR}/src/index.js

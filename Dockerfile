FROM node:14.15.4-alpine
RUN apk add --update --no-cache openssh sshpass
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ['sh','./docker-entry.sh']
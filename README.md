# Hookcmd

Configurable SSH Commands available though GET hooks.

## Dev

(docker rm -f hookcmd||true) && (docker run --rm --name hookcmd --env-file ./.env -w /app \
--net=caddy-node_caddy --net-alias=hookcmd \
-v "$(pwd)/src:/app/src" \
-v "$(pwd)/data:/app/data" \
-v "$(pwd)/docker-entry.sh:/app/docker-entry.sh" \
-v "$(pwd)/package.json:/app/package.json" \
-v "$(pwd)/package.lock.json:/app/package.lock.json" \
-v "/root/.npm/_cacache:/root/.npm/_cacache" \
node:13.5.0-alpine sh docker-entry.sh)

## Deployment

```sh
sh ./docker.sh && docker logs -f hookcmd
```
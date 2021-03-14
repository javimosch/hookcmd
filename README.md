# Hookcmd

Configurable SSH Commands available though GET hooks.

## FAQ

### - How to install ?

- _If you don't plan to use reverse proxy, edit docker-compose.yml and expose port 3000 to your host._
- docker-compose up -d --build

### - How to configure ssh?

- Copy your private key into project
- Set the path in env file (SSH_KEY)
- Authorize the public key in the server.
```sh
ssh-copy-id -i ~/.ssh/id_rsa.pub user@xxx.xxx.xxx.xxx
```
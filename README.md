# End to End Chat (Proof of Concept)

## Description
This is a proof of concept for a end to end chat application, where the user can chat with the other user WITH encyrpyted messages. Where all of this messages are encyrpyted using shared key from Diffie-Hielman key exchange method.

## Prerequisite
### Tools that need to installed
1) [uv](https://github.com/astral-sh/uv)
2) FastAPI

### App structure
1) **server/** 
This is the relay server that will be used to relay the messages between the user and their peer.

2) **client/** 
This is the client that will be used to connect to the server and send and receive messages. CLI base

3) **fe/**
This is the frontend that will be used to connect to the server and send, receive messages, show our & peer messages.

4) **deploy/**
This is the directory that will be used to deploy the app to a server. It contains the configuration for the docker-compose and the traefik configuration

## How to use
1) create the virtual environment for the server first
```bash
cd server/
uv venv

source venv/bin/activate
```

2) run the server
```bash
fastapi dev main.py
```

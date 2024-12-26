import asyncio
import websockets
from cryptography.hazmat.primitives.asymmetric import dh

from client import Client


async def main():
    server_uri = f"ws://localhost:8000/ws/chat/{123}"

    try:
        async with websockets.connect(server_uri) as ws:
            parameter = dh.generate_parameters(generator=2, key_size=2048)

            private_key = parameter.generate_private_key()
            public_key = private_key.public_key()

            server = Client(private_key, public_key)
            await server.client(ws, user_id="122", peer_id="123")
    except websockets.exceptions.ConnectionClosedError as e:
        print(f"WebSocket connection closed: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    asyncio.run(main())

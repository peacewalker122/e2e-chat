import asyncio

import argparse
from client import Client


async def main(client_id: str, peer_id: str):
    try:
        client = Client(client_id, server_id=peer_id)
        await client.client()
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="E2E Chat Client")

    _ = parser.add_argument("-c", "--client-id", required=True, help="Your client ID")
    _ = parser.add_argument(
        "-p", "--peer-id", required=True, help="Peer ID to chat with"
    )

    args = parser.parse_args()
    client_id = str(args.client_id)
    peer_id = str(args.peer_id)

    asyncio.run(main(client_id, peer_id))

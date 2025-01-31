from cgitb import enable
from imaplib import Commands
from ecdh import ECDHKeyExchange
from model import Message
from websocket import WebSocket, WebSocketApp


class Client:
    shared_secret: bytes | None = None
    ecdh: ECDHKeyExchange = ECDHKeyExchange()
    client_id: str
    server_id: str

    def __init__(self, client_id: str, server_id: str):
        super(Client, self).__init__()
        self.client_id = client_id
        self.server_id = server_id

    def on_message(self, ws: WebSocket, message: bytes):
        msg = Message.model_validate_json(message)

        if msg.command == "message" or msg.command == "msg":
            print(msg.message)
            while True:
                inputs = input(f"{self.client_id}> ")
                _ = ws.send(
                    Message(
                        sender_id=self.client_id,
                        receiver_id=self.server_id,
                        message=inputs,
                        command="message",
                    ).model_dump_json()
                )
                print("\n")

        if msg.command == "key-exchange":
            if not self.shared_secret:
                try:
                    public_bytes = self.ecdh.get_public_bytes()
                    _ = ws.send(
                        Message(
                            sender_id=self.client_id,
                            receiver_id=self.server_id,
                            message=public_bytes.hex(),
                            command="key-exchange",
                        ).model_dump_json()
                    )

                    self.shared_secret, _ = self.ecdh.generate_shared_secret(
                        bytes.fromhex(msg.message)
                    )
                    print("\nKey exchange successful! You can now start chatting.")
                    print("Type your message and press Enter to send.")

                    # Start chat after successful key exchange
                    user_input = input(f"{self.client_id}> ")
                    _ = ws.send(
                        Message(
                            sender_id=self.client_id,
                            receiver_id=self.server_id,
                            message=user_input,
                            command="message",
                        ).model_dump_json()
                    )
                except Exception as e:
                    print(f"Key exchange failed: {e}")

            return

    def on_open(self, ws: WebSocket):
        if not self.shared_secret:
            public_bytes = self.ecdh.get_public_bytes()
            _ = ws.send(
                Message(
                    sender_id=self.client_id,
                    receiver_id=self.server_id,
                    message=public_bytes.hex(),
                    command="key-exchange",
                ).model_dump_json()
            )
            print("WebSocket connection opened")

        return

    def on_close(self, ws: WebSocket, close_code: int, close_msg: str):
        print("WebSocket connection closed")

    def on_error(self, ws: WebSocket, error: Exception):
        print(f"WebSocket error: {error}")
        ws.close()

    async def client(self):
        # Serialize the public key for transmission
        serialized_public_key = self.ecdh.get_public_bytes()
        server_uri = f"ws://localhost:8000/ws/chat/{self.client_id}"

        ws = WebSocketApp(
            server_uri,
            on_message=self.on_message,
            on_open=self.on_open,
            on_error=self.on_error,
            on_close=self.on_close,
        )

        _ = ws.run_forever(reconnect=5, dispatcher=rel)
        _ = rel.signal(2, rel.abort)
        rel.dispatch()

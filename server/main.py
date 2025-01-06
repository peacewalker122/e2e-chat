from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from model import Message

app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, message: Message):
        sender_websocket = self.active_connections.get(message.sender_id)
        receiver_websocket = self.active_connections.get(message.receiver_id)

        if receiver_websocket:
            await receiver_websocket.send_text(message.model_dump_json())
        else:
            if sender_websocket:
                await sender_websocket.send_text(
                    Message(
                        sender_id=message.receiver_id,
                        receiver_id=message.sender_id,
                        message=f"User {message.receiver_id} is offline.",
                        command="info",
                        timestamp=message.timestamp,
                        checksum=None,
                    ).model_dump_json()
                )


manager = ConnectionManager()


@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                await websocket.send_text(
                    "Invalid message format. Provide 'receiver_id' and 'message'."
                )

            msg = Message.model_validate_json(data, strict=False)

            if data and msg:
                await manager.send_message(msg)
    except WebSocketDisconnect:
        manager.disconnect(user_id)

    except Exception as e:
        await manager.send_message(
            Message(
                sender_id=user_id,
                receiver_id=user_id,
                message=str(e),
                command="error",
                timestamp=0,
                checksum=None,
            )
        )

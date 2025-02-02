import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from model import Message

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add Gzip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


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
            logger.info("Sending message to user %s", message.receiver_id)
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


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.websocket("/chat/{user_id}")
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
            logger.info(f"Received message from user {user_id}: {msg}")

            if data and msg:
                await manager.send_message(msg)

    except WebSocketDisconnect:
        manager.disconnect(user_id)

    except Exception as e:
        logger.error(f"Error for user {user_id}: {e}", exc_info=True)
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

from pydantic import BaseModel


class Message(BaseModel):
    sender_id: str
    receiver_id: str
    message: str
    command: str
    timestamp: int
    checksum: str | None

from pydantic import BaseModel, Field
import time


class Message(BaseModel):
    sender_id: str
    receiver_id: str
    message: str
    command: str
    timestamp: int = Field(default_factory=lambda: int(time.time()))
    checksum: str | None = Field(default=None)

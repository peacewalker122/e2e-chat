from pydantic import BaseModel


class GetTokenRequest(BaseModel):
    token: str

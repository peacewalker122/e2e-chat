from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.websocket import router as websocket_router
from src.auth import router as auth_router

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

app.include_router(websocket_router)
app.include_router(auth_router)


@app.get("")
async def root():
    return {"message": "Hello World"}


@app.get("health")
async def health():
    return {"status": "ok"}

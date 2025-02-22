import logging
from src.config import load_config
from src.app import app
from src.auth import router as auth_router
from src.websocket import router as websocket_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Add Gzip compression middleware


app.include_router(auth_router)
app.include_router(websocket_router)

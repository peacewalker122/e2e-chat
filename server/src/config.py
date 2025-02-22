import os
import yaml
from pydantic import BaseModel, Field
from typing import Optional


# Define a structured model for server settings
class ServerConfig(BaseModel):
    host: str = Field(..., description="The host where the server runs")
    port: int = Field(..., description="The port number of the server")


class FirebaseConfig(BaseModel):
    public_key: str
    project_id: str


class JWTConfig(BaseModel):
    secret: str = Field(..., description="The secret key for JWT")


# Define a structured model for database settings
class DatabaseConfig(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None


# Main configuration class that aggregates everything
class AppConfig(BaseModel):
    server: ServerConfig
    database: Optional[DatabaseConfig] = None
    jwt: Optional[JWTConfig] = None
    firebase: FirebaseConfig


def load_config(yaml_path: str = "config.yaml") -> AppConfig:
    with open(yaml_path, "r") as file:
        raw_config = yaml.safe_load(file)

    # Initialize missing sections with empty dicts
    raw_config.setdefault("server", {})
    raw_config.setdefault("database", {})
    raw_config.setdefault("firebase", {})
    raw_config.setdefault("jwt", {})

    # Override YAML with environment variables if available
    raw_config["server"]["port"] = int(
        os.getenv("SERVER_PORT", raw_config["server"].get("port", 8000))
    )
    raw_config["server"]["host"] = os.getenv(
        "SERVER_HOST", raw_config["server"].get("host", "0.0.0.0")
    )

    # Database config is optional
    if "database" in raw_config:
        raw_config["database"]["host"] = os.getenv(
            "DATABASE_HOST", raw_config["database"].get("host")
        )
        raw_config["database"]["port"] = (
            int(os.getenv("DATABASE_PORT", raw_config["database"].get("port", 0)))
            if os.getenv("DATABASE_PORT") or raw_config["database"].get("port")
            else None
        )
        raw_config["database"]["username"] = os.getenv(
            "DATABASE_USER", raw_config["database"].get("username")
        )
        raw_config["database"]["password"] = os.getenv(
            "DATABASE_PASS", raw_config["database"].get("password")
        )

    # Required Firebase config
    raw_config["firebase"]["public_key"] = os.getenv(
        "FIREBASE_PUBLIC_KEY", raw_config["firebase"].get("public_key")
    )
    raw_config["firebase"]["project_id"] = os.getenv(
        "FIREBASE_PROJECT_ID", raw_config["firebase"].get("project_id")
    )

    # Optional JWT config
    if "jwt" in raw_config:
        raw_config["jwt"]["secret"] = os.getenv(
            "JWT_SECRET", raw_config["jwt"].get("secret")
        )

    # Validate and return structured config
    return AppConfig(**raw_config)


cfg = load_config("config/config.yml")

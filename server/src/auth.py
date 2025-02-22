from datetime import datetime, timedelta
from logging import getLogger
from fastapi import APIRouter, HTTPException
from jwt import decode, encode, ExpiredSignatureError, InvalidTokenError
from dto.auth import GetTokenRequest
from src.config import cfg

from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend

logger = getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_public_key_from_certificate(certificate_str: str):
    """Extract public key from X509 certificate string"""
    # Remove any whitespace and newlines
    cert_bytes = certificate_str.encode("utf-8")
    cert = load_pem_x509_certificate(cert_bytes, default_backend())
    return cert.public_key()


@router.post("/token")
async def gettoken(req: GetTokenRequest):
    """
    Accept JWT token from Firebase, convert into our own token with asymmetric algorithm
    to be used for authentication
    """
    try:
        # Verify Firebase token
        public_key = get_public_key_from_certificate(cfg.firebase.public_key)
        payload = decode(
            req.token,
            public_key,
            algorithms=["RS256"],
            audience=cfg.firebase.project_id,
        )

        # Verify token issuer
        expected_issuer = f"https://securetoken.google.com/{cfg.firebase.project_id}"
        if payload["iss"] != expected_issuer:
            logger.warning(f"Invalid token issuer: {payload['iss']}")
            raise HTTPException(status_code=401, detail="Invalid token issuer")

        # Create new token with expiration
        newtoken = encode(
            {
                "user_id": payload["user_id"],
                "email": payload["email"],
                "iss": "e2echat",
                "exp": datetime.utcnow() + timedelta(hours=24),  # 24 hour expiration
                "iat": datetime.utcnow(),
            },
            cfg.jwt.secret,
            algorithm="HS256",
        )

        return {"token": newtoken}

    except ExpiredSignatureError:
        logger.warning("Expired token received")
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError as e:
        logger.error(f"Invalid token format: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        logger.error(f"Unexpected error processing token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

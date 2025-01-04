from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.exceptions import InvalidKey
import os


class ECDHKeyExchange:
    curve: ec.EllipticCurve
    private_key: ec.EllipticCurvePrivateKey
    public_key: ec.EllipticCurvePublicKey

    def __init__(self, curve: ec.EllipticCurve = ec.SECP256R1()) -> None:
        """Initialize with a specific curve. Default is SECP256R1."""
        self.curve = curve
        self.private_key = ec.generate_private_key(curve)
        self.public_key = self.private_key.public_key()

    def get_public_bytes(self) -> bytes:
        """Get public key in bytes format for sending to other party."""
        return self.public_key.public_bytes(
            encoding=Encoding.X962, format=PublicFormat.CompressedPoint
        )

    def load_peer_public_key(
        self, peer_public_bytes: bytes
    ) -> ec.EllipticCurvePublicKey:
        """Load peer's public key from bytes."""
        try:
            return ec.EllipticCurvePublicKey.from_encoded_point(
                self.curve, peer_public_bytes
            )
        except ValueError as e:
            raise ValueError(f"Invalid public key: {e}")

    def generate_shared_secret(
        self, peer_public_bytes: bytes, salt: bytes | None = None
    ) -> tuple[bytes, bytes]:
        """Generate shared secret using peer's public key."""
        if not self.private_key:
            raise ValueError("No private key available")

        try:
            peer_public_key = self.load_peer_public_key(peer_public_bytes)
            shared_key = self.private_key.exchange(ec.ECDH(), peer_public_key)

            # Derive a key using HKDF
            if salt is None:
                salt = os.urandom(16)

            derived_key = HKDF(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                info=b"handshake data",
            ).derive(shared_key)

            return derived_key, salt

        except InvalidKey:
            raise ValueError("Invalid key exchange")
        except Exception as e:
            raise ValueError(f"Key exchange failed: {e}")

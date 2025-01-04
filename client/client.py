from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import websockets

from model import Message


class Client:
    private_key: ec.EllipticCurvePrivateKey
    public_key: ec.EllipticCurvePublicKey
    shared_secret: bytes | None

    def __init__(self):
        super(Client, self).__init__()
        # Generate EC private and public keys
        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.public_key = self.private_key.public_key()
        self.shared_secret = None

    async def client(
        self, ws: websockets.WebSocketClientProtocol, user_id: str, peer_id: str
    ):
        # Serialize the public key for transmission
        serialized_public_key = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Send public key to server
        while ws.open:
            if self.shared_secret is None:
                await ws.send(
                    Message(
                        sender_id=user_id,
                        receiver_id=peer_id,
                        message=serialized_public_key.decode("utf-8"),
                        command="key-exchange",
                        timestamp=0,
                        checksum=None,
                    ).model_dump_json()
                )

            resp = await ws.recv()
            if len(resp) == 0:
                continue

            data = Message.model_validate_json(resp)

            if data.command == "key-exchange":
                try:
                    # Load the peer's public key
                    peer_public_key = serialization.load_pem_public_key(
                        data.message.encode("utf-8"), backend=default_backend
                    )

                    # Compute the shared secret using ECDH
                    shared_secret = self.private_key.exchange(
                        ec.ECDH(), peer_public_key
                    )

                    # Derive a key from the shared secret
                    self.shared_secret = HKDF(
                        algorithm=hashes.SHA256(),
                        length=32,
                        salt=None,
                        info=b"handshake data",
                    ).derive(shared_secret)

                except Exception as e:
                    print(e)
                    continue

    # def encrypt_message(message, key, nonce):
    #     from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    #     cipher = Cipher(algorithms.AES(key), modes.GCM(nonce))
    #     encryptor = cipher.encryptor()
    #     ciphertext = encryptor.update(message.encode()) + encryptor.finalize()
    #     return ciphertext

    # def decrypt_message(ciphertext, key, nonce):
    #     from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    #     cipher = Cipher(algorithms.AES(key), modes.GCM(nonce))
    #     decryptor = cipher.decryptor()
    #     return decryptor.update(ciphertext) + decryptor.finalize()

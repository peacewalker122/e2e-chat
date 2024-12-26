from cryptography.hazmat.primitives.asymmetric import dh
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import websockets

from model import Message


class Client:
    private_key: dh.DHPrivateKey
    public_key: dh.DHPublicKey
    shared_secret: bytes | None

    def __init__(self, private_key: dh.DHPrivateKey, public_key: dh.DHPublicKey):
        super(Client, self).__init__()
        self.private_key = private_key  # Assign to instance attribute
        self.public_key = public_key  # Assign to instance attribute
        self.shared_secret = None

    async def client(
        self, ws: websockets.WebSocketClientProtocol, user_id: str, peer_id: str
    ):
        # shared_secret = bytes()

        serialized_public_key = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Send public key to server
        while ws.open:
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
            data = Message.model_validate_json(resp)

            if data.command == "key-exchange":
                peer_public_key = serialization.load_pem_public_key(
                    data.message.encode("utf-8")
                )

                shared_secret = self.private_key.exchange(priv_key.public_key())

                self.shared_secret = HKDF(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=None,
                    info=b"handshake data",
                ).derive(shared_secret)

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

from ecdh import ECDHKeyExchange

if __name__ == "__main__":
    # Client 1
    client1 = ECDHKeyExchange()
    client1_public = client1.get_public_bytes()

    # Client 2
    client2 = ECDHKeyExchange()
    client2_public = client2.get_public_bytes()

    print(client1_public.hex())
    print(client2_public.hex())

    # Exchange public keys (in a real scenario, this would happen over a network)
    # Client 1 generates shared secret using Client 2's public key
    shared_secret1, salt = client1.generate_shared_secret(client2_public)

    # Client 2 generates shared secret using Client 1's public key and same salt
    shared_secret2, _ = client2.generate_shared_secret(client1_public, salt)

    # Both shared secrets should be identical
    assert shared_secret1 == shared_secret2

    print(shared_secret1.hex())

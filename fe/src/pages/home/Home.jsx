import {useContext} from "react";
import {AuthContext} from "../context/authContext.jsx";
import {redirect} from "react-router";

import { useState, useEffect, useRef } from "react";
import ChatComponent from "../../component/ChatComponent.jsx";

const Home = ({baseUrl}) => {
    const {user} = useContext(AuthContext)


    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const sharedKeyRef = useRef(null);
    const keyPairRef = useRef(null);
    const publicKeyRef = useRef(null);
    const [peerId, setPeerId] = useState("")

    if (user === null) {
        redirect('/login')
    }

    const userId = user.email;

    // Key exchange state management
    const keyExchangeStateRef = useRef({
        initiated: false,
        completed: false,
        retries: 0,
        maxRetries: 3,
    });
    // Generate key pair and export the public key
    const generateKeys = async () => {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            true,
            ["deriveKey"]
        );
        keyPairRef.current = keyPair;
        const exportedPublicKey = await window.crypto.subtle.exportKey(
            "raw",
            keyPair.publicKey
        );
        publicKeyRef.current = exportedPublicKey;
        return exportedPublicKey;
    };

    // Derive the shared key using the peer's public key
    const deriveSharedKey = async (peerPublicKey) => {
        const importedPeerKey = await window.crypto.subtle.importKey(
            "raw",
            peerPublicKey,
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            true,
            []
        );

        const sharedKey = await window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: importedPeerKey,
            },
            keyPairRef.current.privateKey,
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );

        sharedKeyRef.current = sharedKey;
        console.log("Shared key stored");
    };

    // Encrypt a message using AES-GCM with the shared key
    const encryptMessage = async (message) => {
        const encoder = new TextEncoder();
        const encodedMessage = encoder.encode(message);

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedMessage = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
            },
            sharedKeyRef.current,
            encodedMessage
        );

        return {
            iv: btoa(String.fromCharCode.apply(null, iv)),
            encryptedData: btoa(
                String.fromCharCode.apply(null, new Uint8Array(encryptedMessage))
            ),
        };
    };

    // Decrypt the incoming message using AES-GCM with the shared key
    const decryptMessage = async (encryptedObj) => {
        try {
            const iv = new Uint8Array(
                Array.from(atob(encryptedObj.iv), (c) => c.charCodeAt(0))
            );
            const encryptedData = new Uint8Array(
                Array.from(atob(encryptedObj.encryptedData), (c) => c.charCodeAt(0))
            );

            const decryptedMessage = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv,
                },
                sharedKeyRef.current,
                encryptedData
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedMessage);
        } catch (error) {
            console.error("Decryption error:", error);
            throw error;
        }
    };

    // Handle key exchange with the peer via the WebSocket
    const handleKeyExchange = async (ws, targetPeerId) => {
        const keyExchangeState = keyExchangeStateRef.current;
        if (keyExchangeState.retries >= keyExchangeState.maxRetries) {
            console.error("Key exchange failed after maximum retries");
            return false;
        }

        try {
            if (!publicKeyRef.current) {
                await generateKeys();
            }
            const publicKeyBase64 = btoa(
                String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current))
            );

            ws.send(
                JSON.stringify({
                    sender_id: userId,
                    receiver_id: targetPeerId,
                    message: publicKeyBase64,
                    command: "key-exchange-init",
                    timestamp: Math.floor(Date.now()),
                    checksum: null,
                })
            );
            keyExchangeState.initiated = true;
            keyExchangeState.retries += 1;
            return true;
        } catch (error) {
            console.error("Error during key exchange:", error);
            return false;
        }
    };

    // Set up the WebSocket connection and event listeners
    useEffect(() => {
        // if (!peerId) {
        //     setMessages((prev) => [...prev, "No Peer ID provided!"]);
        //     return;
        // }

        const ws = new WebSocket(`${baseUrl}/chat/${userId}`);
        wsRef.current = ws;

        ws.addEventListener("open", async () => {
            console.log("WebSocket connected");
            setConnected(true);
            await handleKeyExchange(ws, peerId);
        });

        ws.addEventListener("message", async (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);

            if (data.command === "key-exchange-init") {
                    const peerPublicKey = new Uint8Array(
                        Array.from(atob(data.message), (c) => c.charCodeAt(0))
                    );
                    await deriveSharedKey(peerPublicKey);
                    console.log("Shared key established with:", data.sender_id);

                    if (!publicKeyRef.current) {
                        await generateKeys();
                    }
                    const publicKeyBase64 = btoa(
                        String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current))
                    );
                    ws.send(
                        JSON.stringify({
                            sender_id: userId,
                            receiver_id: data.sender_id,
                            message: publicKeyBase64,
                            command: "key-exchange-response",
                            timestamp: Math.floor(Date.now()),
                            checksum: null,
                        })
                    );
            } else if (data.command === "key-exchange-response") {
                const peerPublicKey = new Uint8Array(
                    Array.from(atob(data.message), (c) => c.charCodeAt(0))
                );
                await deriveSharedKey(peerPublicKey);
                console.log("Shared key established with:", data.sender_id);
            } else if (data.command === "chat") {
                try {
                    const encryptedObj = JSON.parse(data.message);
                    const decrypted = await decryptMessage(encryptedObj);
                    setMessages((prev) => [...prev, `${peerId}: ${decrypted}`]);
                } catch (error) {
                    console.error("Error decrypting message:", error);
                }
            }
        });

        ws.addEventListener("close", () => {
            console.log("WebSocket disconnected");
            setConnected(false);
        });

        return () => {
            ws.close();
        };
    }, [userId, peerId, baseUrl]);

    // Handler for sending messages
    const sendMessage = async (message) => {
        if (message && sharedKeyRef.current) {
            try {
                const encryptedMessage = await encryptMessage(message);
                const messageObj = {
                    sender_id: userId,
                    receiver_id: peerId,
                    message: JSON.stringify(encryptedMessage),
                    command: "chat",
                    timestamp: Math.floor(Date.now()),
                    checksum: null,
                };
                wsRef.current.send(JSON.stringify(messageObj));
                setMessages((prev) => [...prev, `You: ${message}`]);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else if (!sharedKeyRef.current) {
            console.log("No shared key, requesting key exchange");
            if (publicKeyRef.current) {
                const publicKeyBase64 = btoa(
                    String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current))
                );
                wsRef.current.send(
                    JSON.stringify({
                        sender_id: userId,
                        receiver_id: peerId,
                        message: publicKeyBase64,
                        command: "key-exchange",
                        timestamp: Math.floor(Date.now()),
                        checksum: null,
                    })
                );
            }
        }
    };

    // Form submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const messageInput = e.target.elements.messageInput;
        const message = messageInput.value.trim();
        if (message) {
            sendMessage(message);
            messageInput.value = "";
        }
    };

    const peerInputRef = useRef('');

    const handleClick = (e) => {
        e.preventDefault();
        console.log('clicked')
        setPeerId(peerInputRef.current.value)
    };

    console.log('peerId: ', peerId);
    return (
        <>
            {!peerId ? (
                <form onSubmit={handleClick}>
                    <label htmlFor="peerId">Email: </label>
                    <input
                        id="peerInput"
                        type="text"
                        name="peerId"
                        placeholder="Email"
                        ref={peerInputRef}
                    />
                    <button type="submit">Connect</button>
                </form>
            ) : (
                <ChatComponent
                    userId={userId}
                    peerId={peerId}
                    handleSubmit={handleSubmit}
                    messages={messages}
                    connected={connected}
                    render={true}
                />
            )}
        </>
    )
}

export default Home
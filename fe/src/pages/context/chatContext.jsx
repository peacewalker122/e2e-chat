import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useAuth } from "./authContext"; // We'll import auth context to get user info
import { useNavigate } from "react-router";

const ChatContext = createContext(null);

export const ChatProvider = ({ children, baseUrl }) => {
	const { user } = useAuth(); // Get user from auth context
	const [messages, setMessages] = useState([]);
	const [connected, setConnected] = useState(false);
	const [peerId, setPeerId] = useState("");
	const [userId, setUserId] = useState("");

	// Refs for WebSocket and crypto
	const wsRef = useRef(null);
	const sharedKeyRef = useRef(null);
	const keyPairRef = useRef(null);
	const publicKeyRef = useRef(null);

	// Key exchange state management
	const keyExchangeStateRef = useRef({
		initiated: false,
		completed: false,
		retries: 0,
		maxRetries: 3,
	});

	const generateKeys = async () => {
		const keyPair = await window.crypto.subtle.generateKey(
			{
				name: "ECDH",
				namedCurve: "P-256",
			},
			true,
			["deriveKey"],
		);
		keyPairRef.current = keyPair;
		const exportedPublicKey = await window.crypto.subtle.exportKey(
			"raw",
			keyPair.publicKey,
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
			[],
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
			["encrypt", "decrypt"],
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
			encodedMessage,
		);

		return {
			iv: btoa(String.fromCharCode.apply(null, iv)),
			encryptedData: btoa(
				String.fromCharCode.apply(null, new Uint8Array(encryptedMessage)),
			),
		};
	};

	// Decrypt the incoming message using AES-GCM with the shared key
	const decryptMessage = async (encryptedObj) => {
		try {
			const iv = new Uint8Array(
				Array.from(atob(encryptedObj.iv), (c) => c.charCodeAt(0)),
			);
			const encryptedData = new Uint8Array(
				Array.from(atob(encryptedObj.encryptedData), (c) => c.charCodeAt(0)),
			);

			const decryptedMessage = await window.crypto.subtle.decrypt(
				{
					name: "AES-GCM",
					iv,
				},
				sharedKeyRef.current,
				encryptedData,
			);

			const decoder = new TextDecoder();
			return decoder.decode(decryptedMessage);
		} catch (error) {
			console.error("Decryption error:", error);
			throw error;
		}
	};

	// Handle key exchange with the peer via the WebSocket
	const handleKeyExchange = async (ws, targetPeerId, userId) => {
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
				String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current)),
			);

			ws.send(
				JSON.stringify({
					sender_id: userId,
					receiver_id: targetPeerId,
					message: publicKeyBase64,
					command: "key-exchange-init",
					timestamp: Math.floor(Date.now()),
					checksum: null,
				}),
			);
			keyExchangeState.initiated = true;
			keyExchangeState.retries += 1;
			return true;
		} catch (error) {
			console.error("Error during key exchange:", error);
			return false;
		}
	};

	// WebSocket connection setup
	useEffect(() => {
		if (!user?.email) return;

		setUserId(user.email);

		const ws = new WebSocket(`${baseUrl}/chat/${user.email}`);
		wsRef.current = ws;

		ws.addEventListener("open", async () => {
			console.log("WebSocket connected");
			setConnected(true);
			await handleKeyExchange(ws, peerId, userId);
		});

		ws.addEventListener("message", async (event) => {
			const data = JSON.parse(event.data);
			console.log("Received message:", data);

			if (data.command === "key-exchange-init") {
				const peerPublicKey = new Uint8Array(
					Array.from(atob(data.message), (c) => c.charCodeAt(0)),
				);
				await deriveSharedKey(peerPublicKey);
				console.log("Shared key established with:", data.sender_id);

				if (!publicKeyRef.current) {
					await generateKeys();
				}
				const publicKeyBase64 = btoa(
					String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current)),
				);
				ws.send(
					JSON.stringify({
						sender_id: userId,
						receiver_id: data.sender_id,
						message: publicKeyBase64,
						command: "key-exchange-response",
						timestamp: Math.floor(Date.now()),
						checksum: null,
					}),
				);
			} else if (data.command === "key-exchange-response") {
				const peerPublicKey = new Uint8Array(
					Array.from(atob(data.message), (c) => c.charCodeAt(0)),
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
	}, [user?.email, peerId, baseUrl]);

	// Message sending function
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
					String.fromCharCode.apply(null, new Uint8Array(publicKeyRef.current)),
				);
				wsRef.current.send(
					JSON.stringify({
						sender_id: userId,
						receiver_id: peerId,
						message: publicKeyBase64,
						command: "key-exchange",
						timestamp: Math.floor(Date.now()),
						checksum: null,
					}),
				);

				setMessages((prev) => [...prev, `You: ${message}`]);
			}
		}
	};

	// Connect to peer function
	const connectToPeer = (peerEmail) => {
		setPeerId(peerEmail);
	};

	const value = {
		messages,
		connected,
		peerId,
		connectToPeer,
		sendMessage,
	};

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChat must be used within a ChatProvider");
	}
	return context;
};

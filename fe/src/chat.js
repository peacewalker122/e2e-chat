import { BASE_URL } from "./config.js";
// Parse the peerId from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const peerId = urlParams.get("peerId");
const userId = urlParams.get("userId");

// Store keys in memory (for this simple POC)
let sharedKey = null;
let keyPair = null;
let publicKey = null;

// Generate keys when page loads
async function generateKeys() {
	// Generate a key pair
	keyPair = await window.crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey"],
	);

	// Export public key to send to peer
	const exportedPublicKey = await window.crypto.subtle.exportKey(
		"raw",
		keyPair.publicKey,
	);
	return exportedPublicKey;
}

// Function to derive shared secret
async function deriveSharedKey(peerPublicKey) {
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

	// Derive the shared key
	sharedKey = await window.crypto.subtle.deriveKey(
		{
			name: "ECDH",
			public: importedPeerKey,
		},
		keyPair.privateKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		true,
		["encrypt", "decrypt"],
	);

	console.log("stored key");
	// window.localStorage.setItem(`shared-key:{peerId}`, sharedKey);
}

// Encryption function
async function encryptMessage(message) {
	const encoder = new TextEncoder();
	const encodedMessage = encoder.encode(message);

	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const encryptedMessage = await window.crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv,
		},
		sharedKey,
		encodedMessage,
	);

	return {
		iv: btoa(String.fromCharCode.apply(null, iv)),
		encryptedData: btoa(
			String.fromCharCode.apply(null, new Uint8Array(encryptedMessage)),
		),
	};
}

// Decryption function
async function decryptMessage(encryptedObj) {
	try {
		console.log(encryptedObj);
		// Convert base64 strings back to Uint8Array
		const iv = new Uint8Array(
			Array.from(atob(encryptedObj.iv), (c) => c.charCodeAt(0)),
		);
		const encryptedData = new Uint8Array(
			Array.from(atob(encryptedObj.encryptedData), (c) => c.charCodeAt(0)),
		);

		const decryptedMessage = await window.crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv,
			},
			sharedKey,
			encryptedData,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedMessage);
	} catch (e) {
		console.error("Decryption error:", e);
		throw e;
	}
}

// Initialize chat functionality
function initChat() {
	// Reference to the messages container
	const messagesDiv = document.getElementById("messages");
	const userDiv = document.getElementById("user-id");
	const userParagraph = userDiv.querySelector(".facade");
	const roomParagraph = userDiv.querySelector(".room-facade");

	// Set the user ID in the paragraph
	userParagraph.textContent = `User ID: ${userId}`;
	roomParagraph.textContent = `Peer ID: ${peerId}`;

	// Simple check to ensure there's a valid peerId
	if (!peerId) {
		messagesDiv.textContent = "No Peer ID provided!";
		return;
	}
	messagesDiv.textContent = `Connected with Peer ID: ${peerId}`;

	// Create a WebSocket connection using the base URL
	const ws = new WebSocket(`${BASE_URL}/chat/${userId}`);

	// Listen for connection open
	ws.addEventListener("open", async () => {
		console.log("WebSocket connected");
		// Initiate key exchange
		await handleKeyExchange(ws, peerId);
	});

	// Keep track of key exchange state
	const keyExchangeState = {
		initiated: false,
		completed: false,
		retries: 0,
		maxRetries: 3,
	};

	// Function to handle key exchange
	async function handleKeyExchange(ws, targetPeerId) {
		if (keyExchangeState.retries >= keyExchangeState.maxRetries) {
			console.error("Key exchange failed after maximum retries");
			return false;
		}

		try {
			if (!publicKey) {
				publicKey = await generateKeys();
			}
			const publicKeyBase64 = btoa(
				String.fromCharCode.apply(null, new Uint8Array(publicKey)),
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
			keyExchangeState.retries++;

			return true;
		} catch (error) {
			console.error("Error during key exchange:", error);
			return false;
		}
	}

	// Listen for messages from the server
	ws.addEventListener("message", async (event) => {
		const data = JSON.parse(event.data);
		console.log("Received message:", data);

		if (data.command === "key-exchange-init") {
			try {
				// Only process if we haven't completed key exchange or if it's a new peer
				if (data.sender_id === peerId) {
					const peerPublicKey = new Uint8Array(
						Array.from(atob(data.message), (c) => c.charCodeAt(0)),
					);

					await deriveSharedKey(peerPublicKey);
					console.log("Shared key established with:", data.sender_id);
					if (!publicKey) {
						publicKey = await generateKeys();
					}
					const publicKeyBase64 = btoa(
						String.fromCharCode.apply(null, new Uint8Array(publicKey)),
					);

					// Send response
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
				}
			} catch (error) {
				console.error("Error processing key exchange:", error);
				if (!keyExchangeState.completed) {
					await handleKeyExchange(ws, data.sender_id);
				}
			}
		} else if (data.command === "key-exchange-response") {
			const peerPublicKey = new Uint8Array(
				Array.from(atob(data.message), (c) => c.charCodeAt(0)),
			);

			await deriveSharedKey(peerPublicKey);
			console.log("Shared key established with:", data.sender_id);
		} else if (data.command === "chat") {
			// Decrypt the received message
			try {
				const encryptedObj = JSON.parse(data.message);
				const decryptedMessage = await decryptMessage(encryptedObj);
				const p = document.createElement("p");
				p.textContent = `${data.from}: ${decryptedMessage}`;
				messagesDiv.appendChild(p);
			} catch (e) {
				console.error("Error decrypting message:", e);
			}
		}
	});

	// On button click, send the message through the WebSocket
	document.getElementById("sendBtn").addEventListener("click", async () => {
		const messageInput = document.getElementById("messageInput");
		const message = messageInput.value.trim();

		console.log("message: ", message);
		if (message && sharedKey) {
			const encryptedMessage = await encryptMessage(message);
			const messageObj = {
				sender_id: userId,
				receiver_id: peerId,
				message: JSON.stringify(encryptedMessage), // Already in base64 format
				command: "chat",
				timestamp: Math.floor(Date.now()),
				checksum: null,
			};

			ws.send(JSON.stringify(messageObj));
			messageInput.value = "";
			const p = document.createElement("p");
			p.textContent = `You: ${message}`;
			messagesDiv.appendChild(p);
		} else if (!sharedKey) {
			console.log("No shared key, requesting key exchange");
			const publicKeyBase64 = btoa(
				String.fromCharCode.apply(null, new Uint8Array(publicKey)),
			);

			ws.send(
				JSON.stringify({
					sender_id: userId,
					receiver_id: peerId,
					message: publicKeyBase64,
					command: "key-exchange",
					timestamp: Math.floor(Date.now()),
					checksum: null,
				}),
			);
		}
	});

	// Listen for connection close
	ws.addEventListener("close", () => {
		console.log("WebSocket disconnected");
	});
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initChat);

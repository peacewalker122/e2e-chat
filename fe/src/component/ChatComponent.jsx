import "./style/chat.css";

const ChatComponent = ({
	render,
	userId,
	peerId,
	handleSubmit,
	connected,
	messages,
	setPeerId,
}) => {
	console.log("messages: ", messages);
	if (!render) {
		return;
	}

	return (
		<div className="container-chat">
			<div className="header">
				<button type="button" onClick={() => setPeerId("")} id="back">
					<img src="/back.svg" alt="back" />
				</button>
				<div id="user-id">
					<p className="facade">User ID: {userId}</p>
					<p className="room-facade">Peer ID: {peerId}</p>
				</div>
			</div>

			<div className="messages">
				<div id="messages">
					{messages.map((msg, index) => (
						<div key={index}>
							<p>{msg}</p>
						</div>
					))}
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				<input
					type="text"
					name="messageInput"
					placeholder="Enter your message"
				/>
				<button type="submit" id="sendBtn">
					Send
				</button>
			</form>

			{!connected && <div className="connection-status">Connecting...</div>}
		</div>
	);
};

export default ChatComponent;

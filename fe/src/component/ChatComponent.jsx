const ChatComponent = ({render,userId,peerId,handleSubmit,connected,messages}) => {
    console.log('render: ',render);
    if (!render) {
        return;
    }

    return (
        <div>
            <div id="user-id">
                <p className="facade">User ID: {userId}</p>
                <p className="room-facade">Peer ID: {peerId}</p>
            </div>
            <div id="messages">
                {messages.map((msg, index) => (
                    <p key={index}>{msg}</p>
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" name="messageInput" placeholder="Enter your message" />
                <button type="submit" id="sendBtn">
                    Send
                </button>
            </form>
            {!connected && <p>Connecting...</p>}
        </div>
    );
};

export default ChatComponent;

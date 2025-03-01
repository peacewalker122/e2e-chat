import { AuthContext, useAuth } from "../context/authContext.jsx";
import { redirect, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import ChatComponent from "../../component/ChatComponent.jsx";
import SideBar from "../../component/SideBar.jsx";
import Navbar from "../../component/Navbar.jsx";
import { useChat } from "../context/chatContext.jsx";

const Home = () => {
	const { user } = useAuth();
	const { messages, connected, peerId, connectToPeer, sendMessage } = useChat();
	const router = useNavigate();
	const [showSidebar, setShowSidebar] = useState(false);
	const peerInputRef = useRef("");

	// Redirect if not authenticated
	useEffect(() => {
		if (!user?.email) {
			router("/login");
		}
	}, [user, router]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const messageInput = e.target.elements.messageInput;
		const message = messageInput.value.trim();
		if (message) {
			sendMessage(message);
			messageInput.value = "";
		}
	};

	const handlePeerConnect = (e) => {
		e.preventDefault();
		connectToPeer(peerInputRef.current.value);
	};

	return (
		<>
			<Navbar showSideBar={setShowSidebar} />
			{showSidebar && <SideBar showSideBar={setShowSidebar} />}
			{!peerId ? (
				<form onSubmit={handlePeerConnect}>
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
					userId={user?.email}
					peerId={peerId}
					handleSubmit={handleSubmit}
					messages={messages}
					connected={connected}
					render={true}
					setPeerId={connectToPeer}
				/>
			)}
		</>
	);
};

export default Home;

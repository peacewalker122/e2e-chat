import "./style/sidebar.css";

const SideBar = ({ chats, showSideBar }) => {
	chats = [
		{
			id: 1,
			peer: "user@peacewalker.my.id",
		},
		{
			id: 2,
			peer: "test@mail.com",
		},
	];

	return (
		<aside className="sidebar">
			<div className="menu">
				<button type="button" onClick={() => showSideBar(false)}>
					<img src="/back-white.svg" alt="menu" />
				</button>
			</div>

			<div className="chats">
				{chats.map((chat, _) => (
					<div key={chat.peer}>
						<img src="/user.svg" alt="user" />
						<p>{chat.peer}</p>
					</div>
				))}
			</div>
		</aside>
	);
};

export default SideBar;

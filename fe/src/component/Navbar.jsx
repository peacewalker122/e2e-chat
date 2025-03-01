import "./style/navbar.css";

const Navbar = ({ showSideBar }) => {
	return (
		<>
			<nav className="navbar">
				<button onClick={() => showSideBar(true)} type="button">
					Menu
				</button>

				<p style={{ color: "white" }}>Navbar</p>
			</nav>
		</>
	);
};

export default Navbar;

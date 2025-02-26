import {Route, Routes} from "react-router";
import Login from "../pages/login/Login.jsx";
import Signup from "../pages/signup/Signup.jsx";
import Home from "../pages/home/Home.jsx";

const AppRoute = () => {
    return (
        <Routes>
            <Route path="/" element={<Home baseUrl={'http://localhost:8000'}/>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
        </Routes>
    )
}

export default AppRoute
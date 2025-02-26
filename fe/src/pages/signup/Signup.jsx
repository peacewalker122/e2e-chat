import {Navigate, NavLink} from "react-router";
import {use, useContext, useState} from "react";
import {signup} from "../../service/authService.js";
import {AuthContext} from "../context/authContext.jsx";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err,setErr] = useState(null);

    const {user,setUser} = useContext(AuthContext)

    const reset = () => {
        setEmail('');
        setPassword('');
    }

    const signUp = async () => {
        try {
            const val = await signup(email, password);
            if (val === null) {
                setEmail("");
            }

            setUser(val)
            console.log('user: ',user)

            return <Navigate to={'/'}/>
        } catch (err) {
            const errorMessage = err?.message || 'An unexpected error occurred.';
            setErr(errorMessage);
            console.error("Error creating user:", err);
        }
    }

    // Handle form submission, prevent default behavior and call signUp
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(email, password);
    await signUp();
  };

    return (
        <>
            <div className={'container'}>
                <h1>Signup</h1>

                <form >
                    <label htmlFor={'email'}>Email: </label>
                    <input type={'email'} name={'email'} placeholder={'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label htmlFor={'password'}> Password: </label>
                    <input type={'password'} name={'password'} placeholder={'Password'} value={password} onChange={(e) => setPassword(e.target.value)} />

                    <p style={{color: 'red'}}>{err}</p>

                    <button type='submit' onClick={handleSubmit}>Submit</button>
                </form>


                <div className={'signup'}>
                    <a>Already Have an Account?</a>

                    <NavLink to="/login" className="ref button">
                        Login
                    </NavLink>
                </div>
            </div>
        </>
    )
}

export default Signup
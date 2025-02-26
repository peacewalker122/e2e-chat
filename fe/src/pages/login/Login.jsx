import {useContext, useState} from 'react'
import './Login.css'
import {NavLink, Route, useNavigate} from "react-router";
import {login} from "../../service/authService.js";
import {AuthContext} from "../context/authContext.jsx";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err,setErr] = useState(null)

    const {user,setUser} = useContext(AuthContext)
    const navigate = useNavigate();

    const reset = () => {
        setEmail('');
        setPassword('');
    }

    const Login = async (e) => {
        try {
            e.preventDefault();

            const user = await login(email, password);
            if (!user) {
                throw new Error('Login failed');
            }
            const token = await user.getIdToken()

            console.log(token);
            setUser(user);
            console.log('user: ',user);

            navigate('/')
        } catch (err) {
            const errorMessage = err?.message || 'An unexpected error occurred.';
            setErr(errorMessage);
            console.error("Error signin user:", err);
        }
    }

  return (
      <>
          <div className={'container'}>
              <h1>Login</h1>

              <form>
                  <label htmlFor={'email'}>Email: </label>
                  <input type={'email'} name={'email'} placeholder={'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />

                  <label htmlFor={'password'}> Password: </label>
                  <input type={'password'} name={'password'} placeholder={'Password'} value={password} onChange={(e) => setPassword(e.target.value)} />

                  <p style={{color: 'red'}}>{err}</p>

                  <button type='submit' onClick={Login}>Submit</button>
              </form>

              <div className={'signup'}>
                  <a>Doesn't have any account?</a>

                  <NavLink to="/signup" className="ref button">
                      Signup
                  </NavLink>
              </div>

          </div>
      </>
  )
}

export default Login

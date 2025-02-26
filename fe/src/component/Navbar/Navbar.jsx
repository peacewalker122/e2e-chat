function Navbar() {
   return (
       <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
           <div className="container">
               <div className="navbar-header">
                   <a className="navbar-brand" href="/public">
                       Company
                   </a>
               </div>
               <div className="collapse navbar-collapse" id="navbarNav">
                   <ul className="navbar-nav">
                       <li className="nav-item">
                           <a className="nav-link" href="/public">Home</a>
                       </li>
                   </ul>
               </div>
           </div>
       </nav>
   )
}

export default Navbar;
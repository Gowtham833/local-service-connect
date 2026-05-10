import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutGrid, User } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
      <div className="container py-5 flex items-center justify-between">
        <Link to="/" className="logo text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          Servi<span className="text-blue-600">Connect</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={`/${role}/dashboard`} className="btn btn-ghost hidden sm:flex font-bold">
                <LayoutGrid size={18} /> Dashboard
              </Link>
              <button onClick={logout} className="btn btn-primary shadow-lg shadow-blue-200">
                <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login/customer" className="btn btn-ghost font-bold text-slate-600">
                Log In
              </Link>
              <Link to="/login/worker" className="btn btn-primary shadow-lg shadow-blue-200">
                Worker Portal
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

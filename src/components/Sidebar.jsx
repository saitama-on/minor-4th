import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h3>PMS</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">Dashboard</Link>
          </li>
          <li className={location.pathname === '/notice-board' ? 'active' : ''}>
            <Link to="/notice-board">Notice Board</Link>
          </li>
          
          
          <li className={location.pathname === '/projects/add' ? 'active' : ''}>
            <Link to="/projects/add">Add New Project</Link>
          </li>
          <li className={location.pathname === '/search' ? 'active' : ''}>
            <Link to="/search">Search Projects</Link>
          </li>
          <li className={location.pathname === '/facultyproject' ? 'active' : ''}>
            <Link to="/facultyproject">Faculty Projects</Link>
          </li>
          <li className={location.pathname === '/students' ? 'active' : ''}>
            <Link to="/students">Manage Students</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 
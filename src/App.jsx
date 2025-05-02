import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useState, useEffect } from 'react';
import Login from './login';
import Signup from './signup';
import Home from './Home';
import SearchBar from './components/searchBar';
import AddProject from './components/AddProject';
import StudentManagement from './components/StudentManagement';
import UserProfiles from './components/UserProfiles';
import FacultyProjects from './components/FacultyProjects';
import Sidebar from './components/Sidebar';
import './App.css';

// Simple NoticeBoard component
const NoticeBoard = () => {
  return (
    <div className="notice-board-container">
      <nav className="navbar">
        <h1>Notice Board</h1>
      </nav>
      <div className="notice-board-content">
        <div className="notice-card">
          <h2>Welcome to the Notice Board</h2>
          <p>This is where important announcements and notifications will appear.</p>
          <p className="notice-date">Posted on: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="notice-card">
          <h2>No New Notices</h2>
          <p>There are no new notices at the moment. Check back later for updates.</p>
          <p className="notice-date">Posted on: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

// Create AuthContext
export const AuthContext = createContext();

// Create AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// AppLayout component for pages that should have the sidebar
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <AppLayout>
              <Home />
            </AppLayout>
          } />
          <Route path="/search" element={
            <AppLayout>
              <SearchBar />
            </AppLayout>
          } />
          <Route path="/facultyproject" element={
            <AppLayout>
              <FacultyProjects />
            </AppLayout>
          } />
          <Route path="/projects/add" element={
            <AppLayout>
              <AddProject />
            </AppLayout>
          } />
          <Route path="/students" element={
            <AppLayout>
              <StudentManagement />
            </AppLayout>
          } />
          <Route path="/profiles/:username" element={
            <AppLayout>
              <UserProfiles />
            </AppLayout>
          } />
          {/* Add route for Notice Board */}
          <Route path="/notice-board" element={
            <AppLayout>
              <NoticeBoard />
            </AppLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

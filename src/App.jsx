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

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/search" element={
            <PrivateRoute>
              <SearchBar />
            </PrivateRoute>
          } />
          <Route path="/facultyproject" element={
            <PrivateRoute>
              <FacultyProjects />
            </PrivateRoute>
          } />
          <Route path="/projects/add" element={
            <PrivateRoute>
              <AddProject />
            </PrivateRoute>
          } />
          <Route path="/students" element={
            <PrivateRoute>
              <StudentManagement />
            </PrivateRoute>
          } />
          <Route path="/profiles/:username" element={
            <PrivateRoute>
              <UserProfiles />
            </PrivateRoute>
          } />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

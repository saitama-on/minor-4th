import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc ,getDocs , collection} from 'firebase/firestore';
import './Home.css';
import InfoModal from './components/modal.jsx';

const Home = () => {
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Fetch all projects from public_projects collection
        const querySnapshot = await getDocs(collection(db, 'public_projects'));
        const allProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter projects where current user is a member
        const currentUserName = auth.currentUser.displayName.toLowerCase();
        const currentUserEmail = auth.currentUser.email.toLowerCase();
        const userProjects = allProjects.filter(project => {
          const groupMembers = project.Group_Members || [];
          return groupMembers.some(member => {
            const memberLower = member.toLowerCase();
            return memberLower.includes(currentUserName) || 
                   memberLower.includes(currentUserEmail) ||
                   memberLower.includes(currentUserEmail.split('@')[0]);
          });
        });

        // Sort projects by creation date
        const sortedProjects = userProjects.sort((a, b) => {
          const dateA = a.created_at?.toDate() || new Date(0);
          const dateB = b.created_at?.toDate() || new Date(0);
          return dateB - dateA;
        });

        setUserProjects(sortedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, auth.currentUser, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  const navigateToProjects = () => {
    navigate('/projects');
  };

  const navigateToAddProject = () => {
    navigate('/projects/new');
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1>Project Management System</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate('/students')} className="manage-students-btn">
            Manage Students
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {error && <div className="error-message">{error}</div>}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <div className="action-card" onClick={() => navigate('/projects/add')}>
            <h3>Add New Project</h3>
            <p>Create and upload a new project</p>
          </div>
          <div className="action-card" onClick={() => navigate('/search')}>
            <h3>Search Projects</h3>
            <p>Browse and search through all projects</p>
          </div>
         
          
        </div>
      </div>

      <div className="projects-section">
        <h2>Your Projects</h2>
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : userProjects.length > 0 ? (
          <div className="projects-grid">
            {userProjects.map(project => (
              <div 
                key={project.id} 
                className="project-card"
                onClick={() => handleProjectClick(project)}
                style={{ cursor: 'pointer' }}
              >
                <h3>{project.title_of_project}</h3>
                <p><strong>Research Area:</strong> {project.Area_of_Research}</p>
                <p><strong>Faculty:</strong> {project.Faculty}</p>
                <p><strong>Category:</strong> {project.Category}</p>
                <p><strong>Group Members:</strong> {project.Group_Members.join(',')}
                </p>
                {project.Report!="" && (
                  <a 
                    href={project.Report} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="view-file"
                    onClick={(e) => e.stopPropagation()} // Prevent modal from opening when clicking the link
                  >
                    View Report
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-projects">
            <p>No projects found.</p>
            <button onClick={() => navigate('/projects/add')} className="add-project-btn">
              Add Your First Project
            </button>
          </div>
        )}
      </div>

      {showModal && selectedProject && (
        <InfoModal
          show={showModal}
          setShow={setShowModal}
          info={selectedProject}
        />
      )}
    </div>
  );
};

export default Home; 
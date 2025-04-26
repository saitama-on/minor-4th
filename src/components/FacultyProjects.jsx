import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import InfoModal from '../components/modal.jsx';
// import '../styles/FacultyProjects.css';
import { useAuth } from '../App';

const FacultyProjects = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const { userRole } = useAuth();
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const projectsSnapshot = await getDocs(collection(db, 'public_projects'));
      
      const projectsList = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        path: doc.ref.path
      }));
      
      // Extract unique faculty names
      const uniqueFaculty = [...new Set(projectsList.map(project => project.Faculty).filter(Boolean))].sort();
      
      setAllProjects(projectsList);
      setFacultyList(uniqueFaculty);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  // Check if current user can edit a project
  const canEditProject = (project) => {
    // Admin and faculty can edit any project
    if (userRole === 'admin' || userRole === 'faculty') {
      return true;
    }
    
    // Check if user is a group member of this project
    const currentUserName = auth.currentUser.displayName?.toLowerCase() || '';
    const currentUserEmail = auth.currentUser.email.toLowerCase();
    const groupMembers = project.Group_Members || [];
    
    return groupMembers.some(member => {
      if (!member) return false;
      const memberLower = member.toLowerCase();
      return memberLower.includes(currentUserEmail) || 
             (currentUserName && memberLower.includes(currentUserName)) ||
             memberLower.includes(currentUserEmail.split('@')[0]);
    });
  };

  const handleEditProject = (e, projectId) => {
    e.stopPropagation(); // Prevent modal from opening
    navigate(`/projects/${encodeURIComponent(projectId)}/edit`);
  };

  const getProjectsByFaculty = () => {
    if (selectedFaculty === 'all') {
      // Group projects by faculty
      const groupedProjects = {};
      
      allProjects.forEach(project => {
        const faculty = project.Faculty || 'Unassigned';
        if (!groupedProjects[faculty]) {
          groupedProjects[faculty] = [];
        }
        groupedProjects[faculty].push(project);
      });
      
      return groupedProjects;
    } else {
      // Return only projects for selected faculty
      const facultyProjects = allProjects.filter(project => project.Faculty === selectedFaculty);
      return { [selectedFaculty]: facultyProjects };
    }
  };

  const facultyProjectsMap = getProjectsByFaculty();

  return (
    <div className="faculty-projects-container">
      <nav className="navbar">
        <h1>Faculty Projects</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="home-btn">
            Dashboard
          </button>
        </div>
      </nav>

      {error && <div className="error-message">{error}</div>}

      <div className="faculty-filter">
        <label htmlFor="faculty-select">Filter by Faculty:</label>
        <select 
          id="faculty-select"
          value={selectedFaculty} 
          onChange={(e) => setSelectedFaculty(e.target.value)}
        >
          <option value="all">All Faculty</option>
          {facultyList.map(faculty => (
            <option key={faculty} value={faculty}>{faculty}</option>
          ))}
        </select>
        <button className="refresh-btn" onClick={fetchProjects}>
          Refresh Projects
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : Object.keys(facultyProjectsMap).length === 0 ? (
        <div className="no-projects">
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="faculty-projects-list">
          {Object.entries(facultyProjectsMap).map(([faculty, projects]) => (
            <div key={faculty} className="faculty-section">
              <h2 className="faculty-name">{faculty}</h2>
              {projects.length === 0 ? (
                <p className="no-faculty-projects">No projects for this faculty</p>
              ) : (
                <div className="projects-grid">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      className="project-card"
                      onClick={() => handleProjectClick(project)}
                    >
                      <h3>{project.title_of_project}</h3>
                      <p><strong>Research Area:</strong> {project.Area_of_Research}</p>
                      <p><strong>Category:</strong> {project.Category || 'Other'}</p>
                      <p><strong>Year:</strong> {project.yearOfSubmission || 'Not specified'}</p>
                      <p><strong>Group Members:</strong> {project.Group_Members?.join(', ') || 'None'}</p>
                      
                      <div className="project-actions">
                        {project.Report && project.Report !== "" && (
                          <a 
                            href={project.Report} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="view-file"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Report
                          </a>
                        )}
                        {canEditProject(project) && (
                          <button 
                            className="edit-project-btn"
                            onClick={(e) => handleEditProject(e, project.title_of_project)}
                          >
                            Edit Project
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

export default FacultyProjects; 
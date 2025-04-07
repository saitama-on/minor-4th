import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import '../styles/ProjectMigration.css';

const ProjectMigration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oldProjects, setOldProjects] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [matchedProjects, setMatchedProjects] = useState([]);
  const [students, setStudents] = useState([]);

  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  // Load students data
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsList);
      } catch (error) {
        console.error('Error loading students:', error);
        setError('Failed to load students data');
      }
    };

    loadStudents();
  }, [db]);

  useEffect(() => {
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email);
      // Get display name from Google auth if available
      setUserName(auth.currentUser.displayName || auth.currentUser.email.split('@')[0]);
    }
  }, [auth.currentUser]);

  // Fetch old projects from info1.json
  const fetchOldProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const infoUrl = await getDownloadURL(ref(storage, 'student/info1.json'));
      const response = await fetch(`https://cors-anywhere-wbl8.onrender.com/${infoUrl}`);
      const data = await response.json();
      
      // Convert object to array and add keys as IDs
      const projectsArray = Object.entries(data).map(([id, project]) => ({
        id,
        ...project
      }));
      
      setOldProjects(projectsArray);
      findUserProjects(projectsArray);
    } catch (error) {
      console.error('Error fetching old projects:', error);
      setError('Failed to fetch old projects');
    } finally {
      setLoading(false);
    }
  };

  // Find projects where the user is a member using student data
  const findUserProjects = (projects) => {
    if (!userEmail || students.length === 0) return;

    // Find current user in students collection
    const currentStudent = students.find(student => 
      student.email.toLowerCase() === userEmail.toLowerCase()
    );

    const userIdentifiers = [
      userEmail.toLowerCase(),
      userName.toLowerCase(),
      userEmail.split('@')[0].toLowerCase()
    ];

    if (currentStudent) {
      userIdentifiers.push(
        currentStudent.name.toLowerCase(),
        currentStudent.roll_no.toLowerCase()
      );
    }

    const matched = projects.filter(project => {
      return project['Group Members']?.some(member => {
        const memberName = member.toLowerCase();
        return userIdentifiers.some(identifier => 
          memberName.includes(identifier) || 
          identifier.includes(memberName.split(':')[0].trim())
        );
      });
    });

    setMatchedProjects(matched);
  };

  // Find student by member name
  const findStudentByMemberName = (memberName) => {
    const normalizedName = memberName.toLowerCase().split(':')[0].trim();
    return students.find(student => {
      const studentName = student.name.toLowerCase();
      const studentRoll = student.roll_no.toLowerCase();
      return studentName.includes(normalizedName) || 
             normalizedName.includes(studentName) ||
             studentRoll.includes(normalizedName) ||
             normalizedName.includes(studentRoll);
    });
  };

  // Migrate selected projects to Firestore
  const migrateProjects = async () => {
    if (!auth.currentUser || matchedProjects.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      for (const project of matchedProjects) {
        // Map group members to student records
        const mappedMembers = project['Group Members'].map(member => {
          const student = findStudentByMemberName(member);
          return {
            name: member,
            studentId: student?.id || null,
            email: student?.email || null,
            roll_no: student?.roll_no || null
          };
        });

        const projectData = {
          title: project['title of project'],
          researchArea: project['Area of Research'],
          faculty: project['Faculty'],
          category: project['Category'] || 'Other',
          groupMembers: mappedMembers,
          fileUrl: project['Report'],
          fileName: project['Report'].split('/').pop(),
          createdBy: auth.currentUser.uid,
          createdAt: new Date(),
          createdByEmail: auth.currentUser.email,
          migratedFrom: 'info1.json',
          originalId: project.id
        };

        // Check if project already exists
        const existingQuery = query(
          collection(db, 'projects'),
          where('originalId', '==', project.id),
          where('migratedFrom', '==', 'info1.json')
        );
        const existingDocs = await getDocs(existingQuery);

        if (existingDocs.empty) {
          // Add to projects collection
          const projectRef = await addDoc(collection(db, 'projects'), projectData);
          const projectId = projectRef.id;

          // Update user's projects
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, {
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            projects: {
              [projectId]: {
                ...projectData,
                projectId: projectId
              }
            }
          }, { merge: true });

          // Add to public projects
          await addDoc(collection(db, 'public_projects'), {
            title_of_project: project['title of project'],
            Area_of_Research: project['Area of Research'],
            Faculty: project['Faculty'],
            Group_Members: mappedMembers,
            Category: project['Category'] || 'Other',
            Report: project['Report'],
            created_at: new Date(),
            created_by: auth.currentUser.email,
            migratedFrom: 'info1.json'
          });

          // Update projects for other group members
          for (const member of mappedMembers) {
            if (member.studentId) {
              const memberQuery = query(
                collection(db, 'users'),
                where('email', '==', member.email)
              );
              const memberDocs = await getDocs(memberQuery);
              
              if (!memberDocs.empty) {
                const memberDoc = memberDocs.docs[0];
                await setDoc(doc(db, 'users', memberDoc.id), {
                  projects: {
                    [projectId]: {
                      ...projectData,
                      projectId: projectId
                    }
                  }
                }, { merge: true });
              }
            }
          }
        }
      }

      setSuccess('Projects successfully migrated!');
    } catch (error) {
      console.error('Error migrating projects:', error);
      setError('Failed to migrate projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="migration-container">
      <h2>Project Migration Tool</h2>
      <p>This tool will help you migrate your projects from the old system to the new one.</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="migration-actions">
        <button 
          onClick={fetchOldProjects} 
          disabled={loading}
          className="fetch-button"
        >
          {loading ? 'Loading...' : 'Find My Projects'}
        </button>

        {matchedProjects.length > 0 && (
          <>
            <h3>Found {matchedProjects.length} projects:</h3>
            <div className="projects-list">
              {matchedProjects.map((project) => (
                <div key={project.id} className="project-item">
                  <h4>{project['title of project']}</h4>
                  <p><strong>Research Area:</strong> {project['Area of Research']}</p>
                  <p><strong>Faculty:</strong> {project['Faculty']}</p>
                  <p><strong>Group Members:</strong></p>
                  <ul>
                    {project['Group Members'].map((member, index) => (
                      <li key={index}>{member}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button 
              onClick={migrateProjects} 
              disabled={loading}
              className="migrate-button"
            >
              {loading ? 'Migrating...' : 'Migrate Selected Projects'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectMigration; 
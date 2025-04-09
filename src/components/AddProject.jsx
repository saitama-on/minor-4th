import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, collection, addDoc , getDocs , query} from 'firebase/firestore';
import '../styles/AddProject.css';

const AddProject = () => {
  const [title, setTitle] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [faculty, setFaculty] = useState('');
  const [category, setCategory] = useState('Other');
  const [students , setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [facultyArray, setFacultyArray] = useState([]);
  const [year , setYear] = useState('2025')
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  const [groupMembers, setGroupMembers] = useState([auth.currentUser.displayName]);

  useEffect(() => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchFacultyData = async () => {
      try {
        const facultyUrl = await getDownloadURL(ref(storage, 'student/faculty.json'));
        const response = await fetch(`https://cors-anywhere-wbl8.onrender.com/${facultyUrl}`);
        const data = await response.json();
        setFacultyArray(Object.keys(data));

        const studentquery = await getDocs(collection(db , 'students'));
        console.log(studentquery.docs)

        
      } catch (error) {
        console.error('Error fetching faculty data:', error);
        setError('Error loading faculty data. Please try again.');
      }
    };

    fetchFacultyData();
  }, [storage, auth.currentUser, navigate]);


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


  useEffect(()=>{
    loadStudents();
  })

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [searchTerm, students]);

  const handleAddMember = () => {
    setShowSearch(true);
    setSearchTerm('');
  };

  const handleRemoveMember = (index) => {
    // Prevent removing the first member (current user)
    if (index === 0) return;
    const updatedMembers = groupMembers.filter((_, i) => i !== index);
    setGroupMembers(updatedMembers);
  };

  const handleMemberChange = (index, value) => {
    if (index === 0) return;
    const updatedMembers = [...groupMembers];
    updatedMembers[index] = value;
    setGroupMembers(updatedMembers);
    setSearchTerm('');
    setShowSearch(false);
    
    // Add to selected students if not already present
    if (!selectedStudents.includes(value)) {
      setSelectedStudents([...selectedStudents, value]);
    }
  };

  const handleRemoveSelectedStudent = (studentName) => {
    setSelectedStudents(selectedStudents.filter(name => name !== studentName));
    setGroupMembers(groupMembers.filter(member => member !== studentName));
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setError('');
    } else {
      setError('Please upload a PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth.currentUser) {
      setError('You must be logged in to add a project');
      setLoading(false);
      return;
    }

    if (!title || !researchArea || !faculty || groupMembers.some(member => !member.trim())) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // 1. Upload file to Firebase Storage
      const fileRef = ref(storage, `project-files/${auth.currentUser.uid}/${title}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      console.log(year)

      // 2. Create project document in Firestore
      const projectData = {
        title: title,
        researchArea: researchArea,
        faculty: faculty,
        category: category,
        groupMembers: groupMembers.filter(member => member.trim()),
        fileUrl: fileUrl,
        fileName: file.name,
        createdBy: auth.currentUser.uid,
        yearOfSubmisson:year,
        createdAt: new Date(),
        createdByEmail: auth.currentUser.email
      };

      // Add to projects collection
      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = projectRef.id;

      // 3. Update user's projects in their document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        email: auth.currentUser.email,
        projects: {
          [projectId]: {
            ...projectData,
            projectId: projectId
          }
        }
      }, { merge: true });

      // 4. Add to public projects collection
      await addDoc(collection(db, 'public_projects'), {
        title_of_project: title,
        Area_of_Research: researchArea,
        Faculty: faculty,
        Group_Members: groupMembers,
        Category: category,
        yearOfSubmission:year,
        Report: fileUrl,
        created_at: new Date(),
        created_by: auth.currentUser.email
      });

      navigate('/search');
    } catch (error) {
      console.error('Error adding project:', error);
      setError('Failed to add project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-project-page">
      <nav className="navbar">
        <h1>Add New Project</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate('/search')} className="nav-button">
            Back to Projects
          </button>
          <button onClick={() => navigate('/')} className="nav-button">
            Dashboard
          </button>
        </div>
      </nav>

      <form className="add-project-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Project Title*</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            required
          />
        </div>

        <div className="form-group">
          <label>Research Area*</label>
          <input
            type="text"
            value={researchArea}
            onChange={(e) => setResearchArea(e.target.value)}
            placeholder="Enter research area"
            required
          />
        </div>

        <div className="form-group">
          <label>Faculty*</label>
          <select value={faculty} onChange={(e) => setFaculty(e.target.value)} required>
            {/* <option value="">Select Faculty</option> */}
            {facultyArray.map((fac) => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year</label>
          <select value={year} onChange={(e)=> setYear(e.target.value)} required>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Other">Other</option>
            <option value="Web/App Dev">Web/App Development</option>
            <option value="AI/ML">AI/ML</option>
            <option value="Blockchain">Blockchain</option>
            <option value="Hardware/Electronics">Hardware/Electronics</option>
          </select>
        </div>

        <div className="form-group">
          <label>Group Members*</label>
          <div className="selected-members">
            <div className="member-item">
              <span>{groupMembers[0]}</span>
              <span className="member-role">(You)</span>
            </div>
            {selectedStudents.map((student, index) => (
              <div key={index} className="member-item">
                <span>{student}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelectedStudent(student)}
                  className="remove-member"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {showSearch ? (
            <div className="search-container">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="search-input"
              />
              {filteredStudents.length > 0 && (
                <div className="search-results">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="search-result-item"
                      onClick={() => handleMemberChange(groupMembers.length, student.name)}
                    >
                      {student.name}
                    </div>
                  ))}
                </div>
              )}
              <button 
                type="button" 
                onClick={() => setShowSearch(false)} 
                className="cancel-search"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleAddMember} className="add-member">
              Add Member
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Project Report (PDF)*</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Adding Project...' : 'Add Project'}
        </button>
      </form>
    </div>
  );
};

export default AddProject; 
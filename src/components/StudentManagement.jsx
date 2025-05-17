import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import '../styles/StudentManagement.css';

const GOOGLE_CLIENT_ID = '348721110835-qa5vubj59savmc6qt0tjbv95tmo3qlnk.apps.googleusercontent.com';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const auth = getAuth();
  const db = getFirestore();

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const adminEmails = ['yashjoshi6787@gmail.com'];
        setIsAdmin(adminEmails.includes(auth.currentUser.email));
      }
    };
    checkAdmin();
  }, [auth.currentUser]);

 
  // Fetch contacts from Google

  // Handle CSV file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
      setError('');
    } else {
      setError('Please upload a valid CSV file');
      setFile(null);
    }
  };

  // Parse CSV and upload students
  const handleUpload = async () => {
    if (!file || !isAdmin) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.trim());

      // Validate headers
      const requiredHeaders = ['name', 'email'];
      const hasAllHeaders = requiredHeaders.every(header => 
        headers.map(h => h.toLowerCase()).includes(header)
      );

      if (!hasAllHeaders) {
        throw new Error('CSV must include name and email columns');
      }

      // Process each row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',').map(cell => cell.trim());
        if (row.length === headers.length && row[0]) {
          const studentData = {
            name: row[headers.findIndex(h => h.toLowerCase() === 'name')],
            email: row[headers.findIndex(h => h.toLowerCase() === 'email')]
            // created_at: new Date(),
            // created_by: auth.currentUser.email
          };

          const existingQuery = query(
            collection(db, 'students'),
            where('email', '==', studentData.email)
          );
          const existingDocs = await getDocs(existingQuery);

          if (existingDocs.empty) {
            await addDoc(collection(db, 'students'), studentData);
          }
        }
      }

      setSuccess('Students data uploaded successfully!');
      loadStudents();
    } catch (error) {
      console.error('Error uploading students:', error);
      setError(error.message || 'Failed to upload students data');
    } finally {
      setLoading(false);
    }
  };

  // Load existing students
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

  useEffect(() => {
    loadStudents();
  }, [db]);

  if (!isAdmin) {
    return <div className="student-management">Access denied. Admin only.</div>;
  }

  return (
    <div className="student-management">
      <h2>Student Management</h2>
      <p>Import students from Google Contacts or upload a CSV file</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}


      <div className="upload-section">
        <h3>Upload CSV File</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="upload-button"
        >
          {loading ? 'Uploading...' : 'Upload Students Data'}
        </button>
      </div>

      <div className="students-list">
        <h3>Uploaded Students ({students.length})</h3>
        <div className="students-grid">
          {students.map(student => (
            <div key={student.id} className="student-card">
              <h4>{student.name}</h4>
              <p><strong>Email:</strong> {student.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentManagement; 
import { useState, useEffect } from 'react';
import '../styles/modal.css';  
import { initializeApp } from "firebase/app";
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { ThreeDot } from 'react-loading-indicators';
import { useNavigate } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';
import { ToastContainer, toast } from 'react-toastify';
import env from 'dotenv';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const auth = getAuth();

function InfoModal({ show, setShow, info }) {
 
  const [file, setFile] = useState(null);
  const [projectDoc, setProjectDoc] = useState(null);
  const navigate = useNavigate();
  const [showToast , setShowToast]  = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      
      try {
        // Search in public_projects collection
        const projectQuery = query(
          collection(db, 'public_projects'),
          where('title_of_project', '==', info['title_of_project'])
        );

        
        const querySnapshot = await getDocs(projectQuery);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
        
          setProjectDoc(doc.data()) ;

        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        
      }
    };

    if (info['title_of_project']) {
      fetchProject();
    }
  }, []);

  const notify_err = (msg) => toast.error(msg);
  const notify_succ = (msg) => toast.success(msg);


  const handleClose = () => {
    setShow(false);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleMemberClick = (member, e) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Prevent modal from closing
    setShow(false); // Close the modal
    const encodedUsername = encodeURIComponent(member.trim());
    navigate(`/profiles/${encodedUsername}`); // Navigate to member's profile
  };

  const uploadData = async () => {
    try {
      // Create a safe file path using project title
      let booli =0;
      for (let i=0 ; i<info['Group_Members'].length ; i++){
        if(info['Group_Members'][i] === auth.currentUser.DisplayName){
          booli =1;
          break;
        }
      }

      if(!booli){
        notify_err("You are not part of this Project");
        return;
      }


      
      const safeProjectTitle = info['title_of_project'].replace(/[^a-zA-Z0-9]/g, '_');
      const storageRef = ref(storage, `project-files/${auth.currentUser.uid}/${safeProjectTitle}/${file.name}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Update or create document in public_projects collection
      const projectData = {
        Report: url,
        updated_at: new Date(),
        updated_by: auth.currentUser.email
      };

      if (projectDoc) {
        // Update existing document
        await updateDoc(projectDoc.ref, projectData);
      } 

      notify_succ('Uploaded Successfully');
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Upload failed. Please try again.');
    } 
  };

  const handleAuth = async () => {
    if (!file) {
      alert('Please select a file!');
      return;
    }

    try {
      await uploadData();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  return (
    <>
      <div className="custom-modal-overlay" onClick={handleClose}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
          <div className="custom-modal-header">
            <button className="close-button" onClick={handleClose}>
              &times;
            </button>
          </div>
          
          {projectDoc===null ? (
            <div className="loading-container">
              <ThreeDot color="#316dcc" size="medium" text="" textColor="" />
            </div>
          ) : (
            <div className="custom-modal-body">
              <div className="inside-modal-div">
                <span className="span-text">Title of Project:</span>
                {info['title_of_project']}
              </div>
              <div className="inside-modal-div">
                <span className="span-text">Area of Research:</span>
                {info['Area_of_Research']}
              </div>
              <div className="inside-modal-div">
                <span className="span-text">Faculty:</span>
                {projectDoc.Faculty}
              </div>
              {info['Category'] && (
                <div className="inside-modal-div">
                  <span className="span-text">Category:</span>
                  {info['Category']}
                </div>
              )}
              
                <div className="inside-modal-div">
                  <span className="span-text">Year of Submission:</span>
                  {projectDoc.yearOfSubmission}
                </div>
              
              <div className="inside-modal-div">
                <span className="span-text">Group Members:</span>
                <div className="members-list">
                  {info['Group_Members'].map((member, idx) => (
                    <span key={idx}>
                      <span 
                        className="member-link"
                        onClick={(e) => handleMemberClick(member, e)}
                      >
                        {member}
                      </span>
                      {idx < info['Group_Members'].length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
              
              {projectDoc.Report !== "" ? (
                <div className="inside-modal-div">
                  <span className="span-text">Report :</span>
                  <a href={projectDoc.Report} target="_blank" rel="noopener noreferrer">View Report</a>
                </div>
              ) : (
                <div className="inside-modal-div upload-section">
                  <span className="span-text">Upload Report:</span>
                  <p>Is this your project? You can upload the report.</p>
                  <input type="file" onChange={handleFileChange} accept=".pdf"></input>
                  <button onClick={handleAuth}>Upload Report</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-center" />
    </>
  );
}

export default InfoModal;

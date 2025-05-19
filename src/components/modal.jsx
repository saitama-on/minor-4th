import { useState, useEffect } from 'react';
import '../styles/modal.css';  
import { initializeApp } from "firebase/app";
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc , doc } from 'firebase/firestore';
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
  const [url , setUrl] = useState();


  useEffect(()=>{
    
  })

  // useEffect(() => {
  //   const fetchProject = async () => {
      
  //     try {
  //       // Search in public_projects collection
  //       const projectQuery = query(
  //         collection(db, 'public_projects'),
  //         where('title_of_project', '==', info['title_of_project'])
  //       );

        
  //       const querySnapshot = await getDocs(projectQuery);
  //       if (!querySnapshot.empty) {
  //         const doc = querySnapshot.docs[0];
        
  //         setProjectDoc(doc.data()) ;

  //       }
  //     } catch (error) {
  //       console.error('Error fetching project:', error);
  //     } finally {
        
  //     }
  //   };

  //   if (info['title_of_project']) {
  //     fetchProject();
  //   }
  // }, []);

  const notify_err = (msg) => toast.error(msg);
  const notify_succ = (msg) => toast.success(msg);


  const handleClose = () => {
    setShow(false);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // alert('this feature is under work!!!!!')
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
      for (let i=0 ; i<info['groupMembers'].length ; i++){
        if(info['groupMembers'][i] === auth.currentUser.displayName){
          booli =1;
          break;
        }
      }
      console.log(auth.currentUser)

      if(!booli){
        notify_err("You are not part of this Project");
        return;
      }


      
      const safeProjectTitle = info['title'].replace(/[^a-zA-Z0-9]/g, '_')+'_'+info['yearOfSubmisson'];
      const storageRef = ref(storage, `project-files/${safeProjectTitle}/${file.name}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // console.log(url)
      setUrl(url);
      
      // Update or create document in public_projects collection
      const q = query(
        collection(db, "projects"),
        where("title", "==", info['title']),
        where("yearOfSubmisson", "==", info['yearOfSubmisson'])
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const projectDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "projects", projectDoc.id), {
          fileUrl: url
        });
      }
      

      notify_succ('Uploaded Successfully');
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Upload failed. Please try again.');
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
          
          {info===null ? (
            <div className="loading-container">
              <ThreeDot color="#316dcc" size="medium" text="" textColor="" />
            </div>
          ) : (
            <div className="custom-modal-body">
              <div className="inside-modal-div">
                <span className="span-text">Title of Project:</span>
                {info['title']}
              </div>
              <div className="inside-modal-div">
                <span className="span-text">Area of Research:</span>
                {info['researchArea']}
              </div>
              <div className="inside-modal-div">
                <span className="span-text">Faculty:</span>
                {info['faculty']}
              </div>
              {info['category'] && (
                <div className="inside-modal-div">
                  <span className="span-text">Category:</span>
                  {info['category']}
                </div>
              )}
              
                <div className="inside-modal-div">
                  <span className="span-text">Year of Submission:</span>
                  {info['yearOfSubmisson']}
                </div>
              
              <div className="inside-modal-div">
                <span className="span-text">Group Members:</span>
                <div className="members-list">
                  {info['groupMembers'].map((member, idx) => (
                    <span key={idx}>
                      <span 
                        className="member-link"
                        onClick={(e) => handleMemberClick(member, e)}
                      >
                        {member}
                      </span>
                      {idx < info['groupMembers'].length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
              
              {info.fileUrl ? (
                <div className="inside-modal-div">
                  <span className="span-text">Report :</span>
                  <a href={info.fileUrl} target="_blank" rel="noopener noreferrer">View Report</a>
                </div>
              ) : url ? (<div className="inside-modal-div">
              <span className="span-text">Report :</span>
              <a href={url} target="_blank" rel="noopener noreferrer">View Report</a>
            </div>): (
                <div className="inside-modal-div upload-section">
                  <span className="span-text">Upload Report:</span>
                  <p>Is this your project? You can upload the report.</p>
                  <input type="file" onChange={handleFileChange} accept=".pdf"></input>
                  <button onClick={uploadData}>Upload Report</button>
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

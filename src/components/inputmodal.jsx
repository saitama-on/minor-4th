import React, { useState , useEffect } from "react";
import '../styles/inputmodal.css'
import { initializeApp } from "firebase/app";
import {ref , getStorage , uploadBytes , getDownloadURL , list} from  'firebase/storage';
import {getAuth, signInWithPopup, GoogleAuthProvider , signOut} from "firebase/auth";
import { useFormState } from "react-dom";
import {ThreeDot} from 'react-loading-indicators'
import env from 'dotenv'
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIRBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

// console.log(json_data)

export default function InputModal({ setInputShow , jsonData  ,setJsonData , facultyArray}) {
  const [groupMembers, setGroupMembers] = useState([""]);
  const [title, setTitle] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [faculty, setFaculty] = useState("");
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("Other");
  const [uploadingLoad , setUploadingLoad] = useState(true);
  
  let index=1;

  useEffect(() => {
    facultyArray = facultyArray.filter((facultyName)=> facultyName != "ALL");
    const fetchData = async () => {
      try {
        const infoUrl = await getDownloadURL(ref(storage, 'student/info1.json'));
        const response = await fetch(`https://cors-anywhere-wbl8.onrender.com/${infoUrl}`,
          {headers: {
            'Origin': 'http://localhost:3000',
            'X-Requested-With': 'XMLHttpRequest'
          }}
        );
        const data= await response.json();
        setJsonData(data);
        console.log(Object.keys(data))
  
        // setJsonData(data);
      } catch (error) {
        console.error("Error fetching JSON data:", error);
      }
    };
  
    fetchData();
  }, []);
 

  const handleClose = () => {
    setInputShow(false);
  
    // auth.signOut();
  }

  // Add New Group Member
  const addGroupMember = () => {
    setGroupMembers([...groupMembers, ""]);
    
  };

  // Remove Group Member
  const removeGroupMember = (index) => {
    const updatedMembers = groupMembers.filter((_, i) => i !== index);
    setGroupMembers(updatedMembers);
  };

  // Handle Input Change for Group Members
  const handleGroupMemberChange = (index, value) => {
    const updatedMembers = [...groupMembers];
    updatedMembers[index] = value;
    setGroupMembers(updatedMembers);
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  // Remove Uploaded File
  const removeFile = () => {
    setFile(null);
  };

  // Validate Inputs
  const handleSubmit = async() => {
    let hasError = false;
    if (!title.trim()) {
      highlightError("title");
      hasError = true;
    }
    if (!researchArea.trim()) {
      highlightError("researchArea");
      hasError = true;
    }
    if (!faculty.trim()) {
      highlightError("faculty");
      hasError = true;
    }
    if (groupMembers.some((member) => !member.trim())) {
      highlightError("groupMembers");
      hasError = true;
    }
    if (!file) {
      alert("Please upload a research paper.");
      hasError = true;
    }

    if (!hasError) {
      
      console.log({ title, researchArea, faculty, groupMembers, file });
      setUploadingLoad(true);

      try{
      const result = await handleUploadData(title , researchArea , faculty , groupMembers ,category,  file);
      // console.log(result)
      }

      catch(err){
        console.log(err)
      }
    
    }
  };


  const handleUploadData = async(title , researchArea , faculty , groupMembers ,category,  file) =>{

    setUploadingLoad(false);


    try {
   
        if(!auth.currentUser){
            const user =  await signInWithPopup(auth,provider);
            const uploadingName = auth.currentUser.displayName.toLowerCase().trim();
            const isPresent = groupMembers.some((member) => {
              const normalizedMember = member.toLowerCase().trim();
              return (
                normalizedMember === uploadingName ||
                uploadingName.split(" ").some((word) => normalizedMember.includes(word))
              );
            });

            
  
            if(isPresent){
              const storageRef = ref(storage , `minor_data/${title}`);
              
              await uploadBytes(storageRef , file).then(async(snap)=>{
                alert("Uploaded Successfully");
                setUploadingLoad(true);
                const url = await getDownloadURL(ref(storage , `minor_data/${title}`));
                setJsonData((prev) => {
                  const newData = { ...prev }; // Create a fresh object
                  const newIndex = Object.keys(prev).length + 1;
                  newData[newIndex] = {
                    "title of project": title,
                    "Area of Research": researchArea,
                    "Faculty": faculty,
                    "Group Members": groupMembers,
                    "Category" : category,
                    "Research Paper": url
                  };
                  
                  return newData;
                });
                
         
              }).catch((err)=>{
                console.log(err)
              })
            }
            
            
        }
        else{
          const uploading_name = auth.currentUser.displayName.toLowerCase().trim();;
          const isPresent = groupMembers.some((member) => {
            const normalizedMember = member.toLowerCase().trim();
            return (
              normalizedMember === uploading_name ||
              uploading_name.split(" ").some((word) => normalizedMember.includes(word))
            );
          });

        
        // console.log(auth.currentUser)

          if(isPresent){
            const storageRef = ref(storage , `minor_data/${title}`);
            await uploadBytes(storageRef , file).then(async(snap)=>{
              alert("Uploaded Successfully");
              setUploadingLoad(true)
              let url = await getDownloadURL(ref(storage , `minor_data/${title}`));
              
              setJsonData((prev) => {
                const newData = { ...prev }; // Create a fresh object
                const newIndex = Object.keys(prev).length + 1;
                newData[newIndex] = {
                  "title of project": title,
                  "Area of Research": researchArea,
                  "Faculty": faculty,
                  "Group Members": groupMembers,
                  "Category": category,
                  "Report": url
                };
                
                return newData;
              });
              
       
            }).catch((err)=>{
              console.log(err)
            })
          }
        }

        
    }

    catch(err){
      console.log(err);
    }


  }



  useEffect(() => {
    if (Object.keys(jsonData).length === 0) return; // Prevent unnecessary uploads
  
    const uploadJsonData = async () => {
      try {
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
  
        await uploadBytes(ref(storage, 'student/info1.json'), jsonBlob);
        console.log('Data updated successfully:', jsonData);
      } catch (err) {
        console.error('Error uploading JSON:', err);
      }
    };
  
    uploadJsonData();
  }, [jsonData]);
  
  // Highlight Error Input
  const highlightError = (id) => {
    document.getElementById(id)?.classList.add("error");
    
  };


  const handleFacultySearch = (e) =>{

  }

  return (
    <div className="custom-modal-overlay" onClick={handleClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h3>Add New Project</h3>
          <button className="close-button" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="custom-modal-body">
          <div className="inside-modal-div">
            <label><strong>Title of Project:</strong></label>
            <input id="title" type="text" placeholder="Enter project title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="inside-modal-div">
            <label><strong>Area of Research:</strong></label>
            <input id="researchArea" type="text" placeholder="Enter research area" value={researchArea} onChange={(e) => setResearchArea(e.target.value)} />
          </div>
          <div className="inside-modal-div">
            <label><strong>Faculty:</strong></label>
            <select value={faculty} onChange={(e)=> setFaculty(e.target.value)} >
              {facultyArray.map((facultyName)=>{
                return <option value={facultyName}>{facultyName}</option>
              })}
            </select>
          </div>
          <div className="inside-modal-div">
            <label><strong>Project Category:</strong></label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="AI/ML">AI/ML</option>
              <option value="Web/App Dev">Web/App Dev</option>
              <option value="Blockchain">Blockchain</option>
              <option value="Hardware/Electronics">Hardware/Electronics</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="inside-modal-div">
            <label><strong>Group Members:</strong></label>
            <div id="groupMembers" className="group-members-container">
              {groupMembers.map((member, index) => (
                <div key={index} className="group-member">
                  <input
                    type="text"
                    placeholder={`Member ${index + 1}`}
                    value={member}
                    onChange={(e) => handleGroupMemberChange(index, e.target.value)}
                  />
                  {groupMembers.length > 1 && (
                    <button className="remove-member" onClick={() => removeGroupMember(index)}>×</button>
                  )}
                </div>
              ))}
              {groupMembers.length <= 3 && <button className="add-member-btn" onClick={addGroupMember}>+ Add Member</button>}
            </div>
          </div>
          <div className="inside-modal-div">
            <label><strong>Upload Research Paper:</strong></label>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} />
            {file && (
              <div className="file-info">
                <span>{file.name}</span>
                <button className="remove-file" onClick={removeFile}>×</button>
              </div>
            )}
          </div>
          {uploadingLoad ? <button className="submit-btn" onClick={handleSubmit}>Submit</button> : <ThreeDot color="#316dcc" size="medium" text="" textColor="" />}
        </div>
      </div>
    </div>
  );
  
}

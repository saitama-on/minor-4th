import React from 'react'
import '../styles/searchBar.css'
import { useState, useEffect } from 'react'
import InfoModal from "./modal.jsx"
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs ,doc, setDoc , updateDoc , query} from 'firebase/firestore';
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { getDownloadURL  ,ref , getStorage } from 'firebase/storage';
import {ThreeDot} from 'react-loading-indicators'
import  env from 'dotenv'

// const firebaseConfig = {
//   apiKey: env.FIREBASE_API_KEY,
//   authDomain: env.FIRBASE_AUTH_DOMAIN,
//   projectId: env.FIREBASE_PROJECT_ID,
//   storageBucket: env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: env.FIREBASE_APP_ID
// };

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export default function SearchBar() {
  const [show, setShow] = useState(false);
  const [loading , setLoading] = useState(true);
  const [data, setData] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [faculty, setFaculty] = useState('ALL')
  const [jsonData, setJsonData] = useState({});
  const [facultyJson, setFacultyJson] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [facultyArray, setFacultyArray] = useState(["ALL"]);
  const navigate = useNavigate();
  const [count , setCount] = useState(0);

  useEffect(() => {
    // Check authentication
  
    const fetchData = async () => {
      try {
        

        const facultyQuery = await getDocs(collection(db , 'faculty'));
        const facultyList = facultyQuery.docs.map((doc)=>{
          setFacultyArray((prev)=>{
            return [...prev , doc.data().name]
          })
        })
        console.log(facultyArray)
        // Fetch faculty data (keeping this from storage for now)
        const querySnapshot = await getDocs(collection(db, '/projects'));
        const projectsData = {};
        querySnapshot.forEach((doc) => {
          projectsData[doc.id] = doc.data();
          // setCount((prev)=> prev+1);
        });
        // console.log(projectsData)
        setCount(Object.keys(projectsData).length)
        setJsonData(projectsData);
        setLoading(false);
        // console.log(projectsData);

        
    
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    let filteredData = Object.values(jsonData);

    if (searchQuery) {
      filteredData = filteredData.filter((item) => {
        return item['title']?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (category !== 'ALL') {
      filteredData = filteredData.filter((item) => 
        item['category']?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (faculty !== 'ALL') {
      filteredData = filteredData.filter((item) => 
        item['faculty']?.toLowerCase().includes(faculty.toLowerCase())
      );
    }

    setFilteredData(filteredData);
    // console.log(filteredData);
  }, [searchQuery, category, faculty, jsonData , db]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCategory('ALL');
    setFaculty('ALL');
  }

  const handleClick = (item) => {
    setShow(true)
    setData(item)
  }

  const handleCategory = (e) => {
    setCategory(e.target.value)
  }

  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigateToHome = () => {
    navigate('/');
  };

  const navigateToAddProject = () => {
    navigate('/projects/add');
  };

  return (
    <div className="projects-page">
      <nav className="navbar">
        <h1>All Projects</h1>
        <div className="nav-buttons">
          <button onClick={navigateToHome} className="nav-button">
            Dashboard
          </button>
          <button onClick={handleLogout} className="nav-button logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />

        <select value={category} onChange={handleCategory} className="filter-select">
          <option value="ALL">All Categories</option>
          <option value="Web/App Dev">Web/App Development</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Blockchain">Blockchain</option>
          <option value="Hardware/Electronics">Hardware/Electronics</option>
          <option value="Other">Other</option>
        </select>

        <select value={faculty} onChange={(e)=>setFaculty(e.target.value)} className="filter-select">
          {facultyArray.map((key ,item)=>{
            return <option value={key} key={item}>{key}</option>
          })}
        </select>

        <button onClick={navigateToAddProject} className="add-project-btn">
          Add Project
        </button>
        <div>Total Projects : {count}</div>
      </div>

      <div className="projects-grid">
        {loading ? (
          <div className="loading-container">
            <ThreeDot color="#007bff" size={30} />
          </div>
        ) : 
          filteredData.map((item, index) => (
            <div key={index} className="project-card" onClick={() => handleClick(item)}>
              <h3><strong>{item['title']}</strong></h3>
              <p>Research Area: <strong>{item['researchArea']}</strong></p>
              <p>Faculty: <strong>{item['faculty']}</strong></p>
              <p>Category: <strong>{item['category']}</strong></p>
              <p>Year: <strong>{item['yearOfSubmisson']}</strong></p>
              <p>Group Members:<strong>{item['groupMembers'].map(stu => <span>{stu}, </span>)}</strong></p>
            </div>
          ))
        }
      </div>

      {show && (
        <InfoModal
          show={show}
          setShow={setShow}
          info={data}
          jsonData={jsonData}
          setJsonData={setJsonData}
        />
      )}
    </div>
  );
}

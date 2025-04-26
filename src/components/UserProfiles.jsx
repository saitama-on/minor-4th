import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs , where , doc , updateDoc} from 'firebase/firestore';
import '../styles/UserProfiles.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ThreeDot } from 'react-loading-indicators';


// function toTitleCase(str){
//     if(!str){
//         return;
//     }
//     let final_str = str.toLowerCase()
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');
//     // console.log(final_str)
//     return final_str;
// }


function UserProfiles() {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { username } = useParams();
    const db = getFirestore();
    // useEffect(()=>{
    //     const updateNames = async ()=>{

    //         try {
    //             const projRef = collection(db , 'public_projects');
    //             const querySnapshot = await getDocs(projRef);
    //             const updatePromise = [];

    //             querySnapshot.forEach((doc)=>{
    //                 const projdocref = doc.ref;
    //                 const projdata = doc.data();

    //                 const ognames = projdata.Group_Members;
    //                 const newnames = ognames.map(item => toTitleCase(item));
    //                 updatePromise.push(
    //                     updateDoc(projdocref , {
    //                         Group_Members: newnames
    //                     })
    //                 )
    //             })
    //             console.log(projRef);
    //         }
    //         catch(err){
    //             console.log(err);
    //         }
    //     }
    //     updateNames();
    // },[])
    

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!username) {
                navigate('/');
                return;
            }

            try {
                const decodedUsername = decodeURIComponent(username).trim();
                // const public_projectsQuery = query(collection(db, 'public_projects'));
                const projectsQuery  = query(collection(db , 'projects'))

                const curr_user = query(collection(db , 'students') , where('name' , '==' , decodedUsername))
                const curr_user_docs = await getDocs(curr_user);
                console.log(curr_user_docs)

                curr_user_docs.forEach((doc)=>{
                    console.log(doc.data())
                })
                const projectsSnapshot = await getDocs(projectsQuery);
                // const publicProjectsSnapshot = await getDocs(public_projectsQuery);
                const userProjects = [];
                
                projectsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const groupMembers = data.groupMembers || [];
                    
                    // Check if the user is a member of this project
                    if (groupMembers.some(member => 
                        member.toLowerCase().trim() === decodeURIComponent(username).toLowerCase().trim()
                    )) {
                        userProjects.push({ 
                            id: doc.id,
                            ...data
                        });
                    }
                });
                // publicProjectsSnapshot.forEach((doc) => {
                //     const data = doc.data();
                //     const groupMembers = data.Group_Members || [];
                    
                //     // Check if the user is a member of this project
                //     if (groupMembers.some(member => 
                //         member.toLowerCase().trim() === decodeURIComponent(username).toLowerCase().trim()
                //     )) {
                //         userProjects.push({ 
                //             id: doc.id,
                //             ...data
                //         });
                //     }
                // });
                console.log(userProjects);

                // Sort projects by creation date if available
                const sortedProjects = userProjects.sort((a, b) => {
                    const dateA = a.created_at?.toDate() || new Date(0);
                    const dateB = b.created_at?.toDate() || new Date(0);
                    return dateB - dateA;
                });

                if (userProjects.length > 0) {
                    setUserProfile({
                        email: decodedUsername,
                        projects: sortedProjects
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [username, navigate, db]);

    const handleProjClick = (e) =>{
        console.log(e.target.value)
    }

    if (loading) {
        return (
            <div className="loading-container">
                <ThreeDot color="#316dcc" size="medium" text="" textColor="" />
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="profiles-container">
                <nav className="navbar">
                    <h1>User Profile</h1>
                    <div className="nav-buttons">
                        <button onClick={() => navigate('/')} className="nav-button">
                            Dashboard
                        </button>
                    </div>
                </nav>
                <div className="no-profile">
                    <h2>No profile found for {decodeURIComponent(username)}</h2>
                    <button onClick={() => navigate('/')} className="nav-button">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profiles-container">
            <nav className="navbar">
                
                <div className="nav-buttons">
                    <button onClick={() => navigate('/')} className="nav-button">
                        Dashboard
                    </button>
                </div>
            </nav>
            
            <div className="profile-content">
                <div className="profile-header-main">
                    <div className="profile-avatar-large">
                        {userProfile.email[0].toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h2>{userProfile.email}</h2>
                        <p>{userProfile.projects.length} Project{userProfile.projects.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <div className="projects-section">
                    <h3>Projects</h3>
                    <div className="projects-grid">
                        {userProfile.projects.map((project, index) => (
                            <div key={index} value={project} className="project-card" onClick={(e) =>handleProjClick(e)}>
                                <h4>{project.title}</h4>
                                <p><strong>Research Area:</strong> {project.researchArea}</p>
                                <p><strong>Faculty:</strong> {project.faculty}</p>
                                <p><strong>Category:</strong> {project.category || 'N/A'}</p>
                                <p><strong>Year Of Submission:</strong> {project.yearOfSubmisson || 'N/A'}</p>
                                <p><strong>Team Members:</strong></p>
                                <div className="team-members">
                                    {project.groupMembers.map((member, idx) => (
                                        <span key={idx}>
                                            <span 
                                                className={`member-link ${member === userProfile.email ? 'current-user' : ''}`}
                                                onClick={() => {
                                                    if (member !== userProfile.email) {
                                                        navigate(`/profiles/${encodeURIComponent(member)}`);
                                                    }
                                                }}
                                            >
                                                {member}
                                            </span>
                                            {idx < project.groupMembers.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </div>
                                {project.Report && (
                                    <a 
                                        href={project.Report} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="view-report"
                                    >
                                        View Report
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfiles; 
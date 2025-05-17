import React, { useState, useEffect } from "react";
import { getDocs, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { useAuth } from "../App";
import "../styles/NoticeBoard.css";

export default function NoticeBoard() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [newNotice, setNewNotice] = useState({
        title: '',
        content: '',
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useAuth();
    const db = getFirestore();

    useEffect(() => {
        setIsAdmin(user?.email === 'yashjoshi6787@gmail.com');
        fetchNotices();
    }, [user]);

    const fetchNotices = async () => {
        try {
            const noticesRef = collection(db, 'notices');
            const querySnapshot = await getDocs(noticesRef);
            const noticesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            }));
            
            noticesList.sort((a, b) => b.date - a.date);
            setNotices(noticesList);
        } catch (error) {
            console.error('Error fetching notices:', error);
            alert("Failed to fetch notices");
        } finally {
            setLoading(false);
        }
    };

    const handleAddNotice = async () => {
        if (!newNotice.title || !newNotice.content) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const noticesRef = collection(db, 'notices');
            await addDoc(noticesRef, {
                ...newNotice,
                timestamp: serverTimestamp(),
                createdBy: user.email
            });

            alert("Notice added successfully");
            setNewNotice({ title: '', content: '' });
            setIsDialogOpen(false);
            fetchNotices();
        } catch (error) {
            console.error('Error adding notice:', error);
            alert("Failed to add notice");
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="notice-board-container">
            <div className="notice-board-header">
                <h1>Notice Board</h1>
                {isAdmin && (
                    <button 
                        className="add-notice-btn"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Add New Notice
                    </button>
                )}
            </div>

            {isDialogOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Notice</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={newNotice.title}
                                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                                    placeholder="Enter notice title"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="content">Content</label>
                                <textarea
                                    id="content"
                                    value={newNotice.content}
                                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                                    placeholder="Enter notice content"
                                    rows={4}
                                />
                            </div>
                            <button 
                                className="submit-btn"
                                onClick={handleAddNotice}
                            >
                                Add Notice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="notices-grid">
                {notices.map((notice) => (
                    <div key={notice.id} className="notice-card">
                        <div className="notice-header">
                            <h3>{notice.title}</h3>
                            <p className="notice-date">
                                Posted on {notice.date.toLocaleDateString()} at {notice.date.toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="notice-content">
                            <p>{notice.content}</p>
                            <p className="notice-author">
                                Posted by: {notice.createdBy}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {notices.length === 0 && (
                <div className="no-notices">
                    <p>No notices available at the moment.</p>
                </div>
            )}
        </div>
    );
}
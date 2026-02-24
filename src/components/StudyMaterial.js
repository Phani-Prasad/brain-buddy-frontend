import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './StudyMaterial.css';
import { API_BASE } from '../config';

const StudyMaterial = ({ language }) => {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [flashcards, setFlashcards] = useState([]);
    const [flippedCards, setFlippedCards] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load documents on mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/documents`);
            setDocuments(response.data.documents || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    // --- FILE UPLOAD ---
    const handleFileUpload = async (file) => {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(ext)) {
            alert('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
            return;
        }

        setUploading(true);
        setUploadProgress('Extracting text & creating embeddings...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE}/api/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadProgress('Done!');
            await fetchDocuments();

            // Auto-select the new document
            if (response.data.document) {
                setSelectedDoc(response.data.document);
                setMessages([]);
                setFlashcards([]);
            }

            setTimeout(() => {
                setUploading(false);
                setUploadProgress('');
            }, 1000);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadProgress('');
            setUploading(false);
            alert(error.response?.data?.detail || 'Error uploading document');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    // --- DELETE DOCUMENT ---
    const handleDeleteDoc = async (docId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this document? This cannot be undone.')) return;

        try {
            await axios.delete(`${API_BASE}/api/documents/${docId}`);
            if (selectedDoc?.id === docId) {
                setSelectedDoc(null);
                setMessages([]);
                setFlashcards([]);
            }
            await fetchDocuments();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // --- ASK QUESTION (RAG) ---
    const askQuestion = async () => {
        if (!input.trim() || !selectedDoc || isLoading) return;

        const question = input;
        setMessages((prev) => [...prev, { role: 'user', content: question }]);
        setInput('');
        setIsLoading(true);
        setActiveAction('query');

        try {
            const formData = new FormData();
            formData.append('question', question);

            const response = await axios.post(
                `${API_URL}/api/documents/${selectedDoc.id}/query`,
                formData
            );

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: response.data.answer,
                    sources: response.data.sources,
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'error', content: 'Error answering question. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    // --- SUMMARIZE ---
    const handleSummarize = async () => {
        if (!selectedDoc || isLoading) return;

        setIsLoading(true);
        setActiveAction('summarize');
        setMessages((prev) => [
            ...prev,
            { role: 'user', content: '📝 Summarize this document' },
        ]);

        try {
            const response = await axios.post(
                `${API_URL}/api/documents/${selectedDoc.id}/summarize`
            );

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: response.data.summary, type: 'summary' },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'error', content: 'Error generating summary.' },
            ]);
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    // --- FLASHCARDS ---
    const handleFlashcards = async () => {
        if (!selectedDoc || isLoading) return;

        setIsLoading(true);
        setActiveAction('flashcards');

        try {
            const response = await axios.post(
                `${API_URL}/api/documents/${selectedDoc.id}/flashcards`
            );

            setFlashcards(response.data.flashcards || []);
            setFlippedCards({});
        } catch (error) {
            alert('Error generating flashcards.');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const toggleFlipCard = (index) => {
        setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    };

    // --- FILE TYPE ICON ---
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'pdf': return '📕';
            case 'docx': return '📘';
            case 'txt': return '📄';
            default: return '📎';
        }
    };

    return (
        <div className="study-material">
            {/* Left Panel: Upload & Document Library */}
            <div className="study-sidebar">
                {/* Upload Area */}
                <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                    />

                    {uploading ? (
                        <div className="upload-progress">
                            <div className="upload-spinner"></div>
                            <p>{uploadProgress}</p>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon">📤</div>
                            <p className="upload-title">Upload Study Material</p>
                            <p className="upload-hint">
                                Drop PDF, DOCX, or TXT here — or click to browse
                            </p>
                        </>
                    )}
                </div>

                {/* Document Library */}
                <div className="doc-library">
                    <h3 className="library-title">📚 My Documents</h3>
                    {documents.length === 0 ? (
                        <p className="no-docs">No documents uploaded yet</p>
                    ) : (
                        <div className="doc-list">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`doc-card ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedDoc(doc);
                                        setMessages([]);
                                        setFlashcards([]);
                                    }}
                                >
                                    <div className="doc-card-icon">{getFileIcon(doc.filename)}</div>
                                    <div className="doc-card-info">
                                        <span className="doc-card-name" title={doc.filename}>
                                            {doc.filename}
                                        </span>
                                        <span className="doc-card-meta">
                                            {doc.num_chunks} chunks • {doc.total_words?.toLocaleString()} words
                                        </span>
                                    </div>
                                    <button
                                        className="doc-delete-btn"
                                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                                        title="Delete document"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Chat & Interaction */}
            <div className="study-main">
                {!selectedDoc ? (
                    <div className="study-empty-state">
                        <div className="empty-icon">📖</div>
                        <h2>Study with Your Documents</h2>
                        <p>Upload a PDF, DOCX, or TXT file, then ask questions, get summaries, or create flashcards from your study material.</p>
                        <div className="feature-cards">
                            <div className="feature-card">
                                <span className="feature-emoji">❓</span>
                                <span>Ask Questions</span>
                            </div>
                            <div className="feature-card">
                                <span className="feature-emoji">📝</span>
                                <span>Summarize</span>
                            </div>
                            <div className="feature-card">
                                <span className="feature-emoji">🧠</span>
                                <span>Flashcards</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Doc Header & Actions */}
                        <div className="study-header">
                            <div className="study-header-info">
                                <span className="study-header-icon">{getFileIcon(selectedDoc.filename)}</span>
                                <div>
                                    <h3 className="study-header-name">{selectedDoc.filename}</h3>
                                    <span className="study-header-meta">
                                        {selectedDoc.num_chunks} chunks • {selectedDoc.total_words?.toLocaleString()} words
                                    </span>
                                </div>
                            </div>
                            <div className="study-actions">
                                <button
                                    className={`action-btn summarize-btn ${activeAction === 'summarize' ? 'loading' : ''}`}
                                    onClick={handleSummarize}
                                    disabled={isLoading}
                                >
                                    📝 Summarize
                                </button>
                                <button
                                    className={`action-btn flashcard-btn ${activeAction === 'flashcards' ? 'loading' : ''}`}
                                    onClick={handleFlashcards}
                                    disabled={isLoading}
                                >
                                    🧠 Flashcards
                                </button>
                            </div>
                        </div>

                        {/* Flashcards View */}
                        {flashcards.length > 0 && (
                            <div className="flashcards-section">
                                <div className="flashcards-header">
                                    <h3>🧠 Flashcards ({flashcards.length})</h3>
                                    <button className="close-flashcards" onClick={() => setFlashcards([])}>
                                        ✕ Close
                                    </button>
                                </div>
                                <div className="flashcards-grid">
                                    {flashcards.map((card, idx) => (
                                        <div
                                            key={idx}
                                            className={`flashcard ${flippedCards[idx] ? 'flipped' : ''}`}
                                            onClick={() => toggleFlipCard(idx)}
                                        >
                                            <div className="flashcard-inner">
                                                <div className="flashcard-front">
                                                    <span className="flashcard-label">Q</span>
                                                    <p>{card.front}</p>
                                                    <span className="flashcard-hint">Click to reveal</span>
                                                </div>
                                                <div className="flashcard-back">
                                                    <span className="flashcard-label">A</span>
                                                    <p>{card.back}</p>
                                                    <span className="flashcard-hint">Click to flip back</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        <div className="study-messages">
                            {messages.length === 0 && flashcards.length === 0 && (
                                <div className="study-welcome">
                                    <p>💡 Ask any question about <strong>{selectedDoc.filename}</strong></p>
                                    <div className="quick-actions">
                                        <button onClick={() => setInput('What are the key concepts in this document?')}>
                                            🔑 Key Concepts
                                        </button>
                                        <button onClick={() => setInput('Explain the main topic in simple terms')}>
                                            🎯 Simplify
                                        </button>
                                        <button onClick={handleSummarize}>
                                            📝 Summarize
                                        </button>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`study-message ${msg.role}`}>
                                    <div className="study-msg-avatar">
                                        {msg.role === 'user' ? '👤' : msg.role === 'error' ? '⚠️' : '📖'}
                                    </div>
                                    <div className="study-msg-content">
                                        <div className="study-msg-text">{msg.content}</div>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <details className="study-sources">
                                                <summary>📎 Sources ({msg.sources.length} chunks used)</summary>
                                                {msg.sources.map((src, i) => (
                                                    <div key={i} className="source-chunk">
                                                        <span className="source-label">Chunk {i + 1}</span>
                                                        <p>{src.length > 200 ? src.substring(0, 200) + '...' : src}</p>
                                                    </div>
                                                ))}
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && activeAction === 'query' && (
                                <div className="study-message assistant">
                                    <div className="study-msg-avatar">📖</div>
                                    <div className="study-msg-content">
                                        <div className="typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="study-input-container">
                            <textarea
                                className="study-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question about your document..."
                                rows="2"
                                disabled={isLoading}
                            />
                            <button
                                className="study-send-btn"
                                onClick={askQuestion}
                                disabled={isLoading || !input.trim()}
                            >
                                {isLoading ? '⏳' : '📤'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudyMaterial;

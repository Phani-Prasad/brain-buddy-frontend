import React, { useState, useEffect, useCallback } from 'react';
import './Flashcards.css';

const API_URL = 'https://brain-buddy-backend-5vgr.onrender.com';

function Flashcards({ userId, subject }) {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [results, setResults] = useState({ got: 0, retry: 0 });
    const [known, setKnown] = useState([]); // indices of known cards
    const [retryQueue, setRetryQueue] = useState([]); // indices to retry
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionDone, setSessionDone] = useState(false);
    const [cardCount, setCardCount] = useState(10);

    const logActivity = (got, total) => {
        if (!userId) return;
        const score = total > 0 ? Math.round((got / total) * 100) : null;
        fetch('http://localhost:8000/api/progress/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                activity_type: 'flashcard_session',
                subject: subject || 'General',
                score,
                metadata: { got, total },
            }),
        }).catch(() => { });
    };

    // Load document list on mount
    useEffect(() => {
        fetch(`${API_URL}/api/documents`)
            .then(r => r.json())
            .then(data => setDocuments(data.documents || []))
            .catch(() => setError('Could not load documents. Is the backend running?'));
    }, []);

    const generateFlashcards = useCallback(async (docId, count) => {
        setLoading(true);
        setError('');
        setCards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setResults({ got: 0, retry: 0 });
        setKnown([]);
        setRetryQueue([]);
        setSessionDone(false);

        try {
            const res = await fetch(`${API_URL}/api/documents/${docId}/flashcards?count=${count}`);
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed to generate');
            const data = await res.json();
            if (!data.flashcards || data.flashcards.length === 0) {
                setError('No flashcards could be generated from this document.');
            } else {
                setCards(data.flashcards);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDocSelect = (doc) => {
        setSelectedDoc(doc);
        generateFlashcards(doc.id, cardCount);
    };

    const handleFlip = () => setIsFlipped(f => !f);

    const handleGotIt = () => {
        setKnown(prev => [...prev, currentIndex]);
        setResults(r => ({ ...r, got: r.got + 1 }));
        advance();
    };

    const handleRetry = () => {
        setRetryQueue(prev => [...prev, currentIndex]);
        setResults(r => ({ ...r, retry: r.retry + 1 }));
        advance();
    };

    const advance = () => {
        setIsFlipped(false);
        const next = currentIndex + 1;
        if (next < cards.length) {
            setCurrentIndex(next);
        } else if (retryQueue.length > 0) {
            // Restart with retry cards
            const retryCards = retryQueue.map(i => cards[i]);
            setCards(retryCards);
            setRetryQueue([]);
            setCurrentIndex(0);
            setTimeout(() => setIsFlipped(false), 10);
        } else {
            setSessionDone(true);
            // When session is done, results state has already been updated for the last card
            setResults(currentResults => {
                logActivity(currentResults.got, currentResults.got + currentResults.retry);
                return currentResults;
            });
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (!cards.length || sessionDone) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleFlip(); }
        if (e.key === 'ArrowRight' && isFlipped) handleGotIt();
        if (e.key === 'ArrowLeft' && isFlipped) handleRetry();
    }, [cards, sessionDone, isFlipped, currentIndex, retryQueue]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const progress = cards.length > 0
        ? Math.round(((known.length + results.retry) / (cards.length + results.retry)) * 100)
        : 0;

    // ── Document picker ───────────────────────────────────────────────────────
    if (!selectedDoc || (cards.length === 0 && !loading && !error)) {
        return (
            <div className="fc-picker">
                <div className="fc-picker-header">
                    <h2>🃏 Flashcard Mode</h2>
                    <p>Pick a document to generate AI flashcards from your study material.</p>
                </div>

                {error && <div className="fc-error">⚠️ {error}</div>}

                {documents.length === 0 && !error ? (
                    <div className="fc-empty">
                        <p>📄 No documents uploaded yet.</p>
                        <p>Go to the <strong>📄 Study Material</strong> tab to upload a PDF, DOCX, or TXT file first.</p>
                    </div>
                ) : (
                    <>
                        <div className="fc-count-row">
                            <label>Cards per session:</label>
                            <select value={cardCount} onChange={e => setCardCount(Number(e.target.value))}>
                                {[5, 10, 15, 20].map(n => (
                                    <option key={n} value={n}>{n} cards</option>
                                ))}
                            </select>
                        </div>
                        <div className="fc-doc-list">
                            {documents.map(doc => (
                                <button
                                    key={doc.id}
                                    className="fc-doc-btn"
                                    onClick={() => handleDocSelect(doc)}
                                >
                                    <span className="fc-doc-icon">📄</span>
                                    <div className="fc-doc-info">
                                        <div className="fc-doc-name">{doc.filename}</div>
                                        <div className="fc-doc-meta">{doc.total_words?.toLocaleString()} words</div>
                                    </div>
                                    <span className="fc-doc-arrow">→</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="fc-loading">
                <div className="fc-spinner" />
                <p>Generating flashcards with AI…</p>
                <p className="fc-loading-sub">This may take a few seconds</p>
            </div>
        );
    }

    // ── Error after doc selected ──────────────────────────────────────────────
    if (error) {
        return (
            <div className="fc-picker">
                <div className="fc-error">⚠️ {error}</div>
                <button className="fc-back-btn" onClick={() => { setSelectedDoc(null); setError(''); }}>
                    ← Back to documents
                </button>
            </div>
        );
    }

    // ── Session complete ──────────────────────────────────────────────────────
    if (sessionDone) {
        const total = results.got + results.retry;
        const pct = total > 0 ? Math.round((results.got / total) * 100) : 0;
        return (
            <div className="fc-done">
                <div className="fc-done-icon">{pct >= 80 ? '🎉' : '💪'}</div>
                <h2>{pct >= 80 ? 'Great job!' : 'Keep practicing!'}</h2>
                <p>You answered <strong>{results.got}</strong> of <strong>{total}</strong> cards correctly ({pct}%)</p>
                <div className="fc-done-actions">
                    <button className="fc-restart-btn" onClick={() => generateFlashcards(selectedDoc.id, cardCount)}>
                        🔄 Start Again
                    </button>
                    <button className="fc-back-btn" onClick={() => { setSelectedDoc(null); setCards([]); }}>
                        ← Choose Another Document
                    </button>
                </div>
            </div>
        );
    }

    // ── Flash card ────────────────────────────────────────────────────────────
    const card = cards[currentIndex];

    return (
        <div className="fc-session">
            {/* Header */}
            <div className="fc-session-header">
                <button className="fc-back-btn-sm" onClick={() => { setSelectedDoc(null); setCards([]); }}>
                    ← Docs
                </button>
                <span className="fc-doc-label">📄 {selectedDoc.filename}</span>
                <span className="fc-counter">{currentIndex + 1} / {cards.length}</span>
            </div>

            {/* Progress bar */}
            <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="fc-progress-stats">
                <span className="fc-stat-got">✅ {results.got} got it</span>
                <span className="fc-stat-retry">🔁 {results.retry} retry</span>
            </div>

            {/* Flip card */}
            <div className={`fc-card-scene ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
                <div className="fc-card">
                    <div className="fc-card-front">
                        <div className="fc-card-label">QUESTION</div>
                        <div className="fc-card-text">{card.front}</div>
                        <div className="fc-flip-hint">Tap to reveal answer ↓</div>
                    </div>
                    <div className="fc-card-back">
                        <div className="fc-card-label">ANSWER</div>
                        <div className="fc-card-text">{card.back}</div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            {isFlipped ? (
                <div className="fc-actions">
                    <button className="fc-btn-retry" onClick={handleRetry}>
                        ❌ Try Again
                    </button>
                    <button className="fc-btn-got" onClick={handleGotIt}>
                        ✅ Got It!
                    </button>
                </div>
            ) : (
                <div className="fc-hint-row">
                    <kbd>Space</kbd> to flip &nbsp;·&nbsp; <kbd>→</kbd> Got it &nbsp;·&nbsp; <kbd>←</kbd> Try again
                </div>
            )}
        </div>
    );
}

export default Flashcards;

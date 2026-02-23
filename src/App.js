import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import Header from './components/Header';
import SubjectSelector from './components/SubjectSelector';
import ChatInterface from './components/ChatInterface';
import ExplainTopic from './components/ExplainTopic';
import PracticeQuestions from './components/PracticeQuestions';
import VoiceTutor from './components/VoiceTutor';
import StudyMaterial from './components/StudyMaterial';
import LandingPage from './components/LandingPage';
import Flashcards from './components/Flashcards';
import Dashboard from './components/Dashboard';

const API_BASE = 'https://brain-buddy-backend-5vgr.onrender.com';

function App() {
  const { i18n, t } = useTranslation();
  const [showLanding, setShowLanding] = useState(true);
  const [appEntering, setAppEntering] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [user, setUser] = useState(null); // { id, username, email }

  // Session ID tied to logged-in user (or random fallback)
  const [sessionId] = useState(() => 'session_' + Date.now());

  // Define subject-specific glow colors
  const subjectColors = {
    math: { primary: 'rgba(99, 102, 241, 0.18)', secondary: 'rgba(236, 72, 153, 0.12)', tertiary: 'rgba(139, 92, 246, 0.1)' },
    science: { primary: 'rgba(16, 185, 129, 0.18)', secondary: 'rgba(6, 182, 212, 0.12)', tertiary: 'rgba(59, 130, 246, 0.1)' },
    english: { primary: 'rgba(245, 158, 11, 0.18)', secondary: 'rgba(249, 115, 22, 0.12)', tertiary: 'rgba(236, 72, 153, 0.1)' },
    history: { primary: 'rgba(239, 68, 68, 0.18)', secondary: 'rgba(245, 158, 11, 0.12)', tertiary: 'rgba(124, 58, 237, 0.1)' },
    programming: { primary: 'rgba(34, 211, 238, 0.18)', secondary: 'rgba(16, 185, 129, 0.12)', tertiary: 'rgba(99, 102, 241, 0.1)' },
    physics: { primary: 'rgba(139, 92, 246, 0.18)', secondary: 'rgba(244, 114, 182, 0.12)', tertiary: 'rgba(59, 130, 246, 0.1)' },
  };

  const currentColors = subjectColors[selectedSubject] || subjectColors.math;

  // On mount: check if a valid token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
            setShowLanding(false);
          } else {
            localStorage.removeItem('bb_token');
            localStorage.removeItem('bb_user');
          }
        })
        .catch(() => {
          // Backend unreachable — stay on landing page
        });
    }
  }, []);

  // Disable browser scroll restoration to prevent jumping during transitions
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Aggressive scroll reset when app mounts or tab changes
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [showLanding, activeTab]);

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  const handleEnter = (loggedInUser) => {
    if (loggedInUser) setUser(loggedInUser);
    setAppEntering(true);
    setShowLanding(false);
    window.scrollTo(0, 0);
    setTimeout(() => setAppEntering(false), 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    setUser(null);
    setShowLanding(true);
    setActiveTab('chat');
  };

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnter={handleEnter} />;
  }

  return (
    <div
      className={`App ${appEntering ? 'app-entering' : ''}`}
      style={{
        '--subject-glow-1': currentColors.primary,
        '--subject-glow-2': currentColors.secondary,
        '--subject-glow-3': currentColors.tertiary,
      }}
    >
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        onLogout={handleLogout}
      />

      <div className="container">
        <div className="settings-bar">
          <SubjectSelector
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
          />

          <select
            className="grade-selector"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          >
            <option value="Elementary">{t('elementary')}</option>
            <option value="Middle School">{t('middleSchool')}</option>
            <option value="High School">{t('highSchool')}</option>
            <option value="College">{t('college')}</option>
          </select>
        </div>

        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 <span className="tab-label">Dashboard</span>
          </button>
          <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            💬 <span className="tab-label">{t('chatTutor')}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>
            🎤 <span className="tab-label">{t('voiceTutor')}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`} onClick={() => setActiveTab('explain')}>
            📖 <span className="tab-label">{t('explainTopic')}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`} onClick={() => setActiveTab('practice')}>
            ✏️ <span className="tab-label">{t('practice')}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`} onClick={() => setActiveTab('study')}>
            📄 <span className="tab-label">{t('studyMaterial')}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveTab('flashcards')}>
            🃏 <span className="tab-label">Flashcards</span>
          </button>
        </div>

        <div className="content">
          {activeTab === 'dashboard' && (
            <Dashboard user={user} />
          )}
          {activeTab === 'chat' && (
            <ChatInterface sessionId={sessionId} subject={selectedSubject} gradeLevel={gradeLevel} language={language} userId={user?.id} />
          )}
          {activeTab === 'voice' && (
            <VoiceTutor sessionId={sessionId} subject={selectedSubject} gradeLevel={gradeLevel} language={language} />
          )}
          {activeTab === 'explain' && (
            <ExplainTopic gradeLevel={gradeLevel} language={language} />
          )}
          {activeTab === 'practice' && (
            <PracticeQuestions subject={selectedSubject} gradeLevel={gradeLevel} language={language} />
          )}
          {activeTab === 'study' && (
            <StudyMaterial language={language} />
          )}
          {activeTab === 'flashcards' && (
            <Flashcards userId={user?.id} subject={selectedSubject} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

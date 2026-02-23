import React from 'react';
import { useTranslation } from 'react-i18next';
import './Header.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Header({ language, onLanguageChange, user, onLogout }) {
  const { t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'te' : 'en';
    onLanguageChange(newLang);
  };

  return (
    <header className="header">
      {/* Left — logo (matches landing navbar) */}
      <div className="header-logo">
        <span className="header-brain-icon">🧠</span>
        <span className="header-brand-name">{t('appName')}</span>
      </div>

      {/* Right — actions */}
      <div className="header-actions">
        <button className="language-toggle" onClick={toggleLanguage}>
          🌐 {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        {user && (
          <div className="header-user">
            <div className="user-avatar" title={user.username}>
              {getInitials(user.username)}
            </div>
            <span className="header-username">{user.username}</span>
            <button className="header-logout" onClick={onLogout} title="Log out">
              ↩
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = 'http://localhost:8000';

const ACTIVITY_LABELS = {
    chat_message: { icon: '💬', label: 'Chat Message' },
    flashcard_session: { icon: '🃏', label: 'Flashcard Session' },
    quiz_attempt: { icon: '✏️', label: 'Quiz Attempt' },
    voice_session: { icon: '🎤', label: 'Voice Session' },
    explanation: { icon: '📖', label: 'Explanation' },
};

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="dash-stat-card" style={{ '--card-color': color }}>
            <div className="dash-stat-icon">{icon}</div>
            <div className="dash-stat-body">
                <div className="dash-stat-value">{value ?? '—'}</div>
                <div className="dash-stat-label">{label}</div>
                {sub && <div className="dash-stat-sub">{sub}</div>}
            </div>
        </div>
    );
}

function WeekChart({ data }) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="dash-week-chart">
            {data.map((d, i) => (
                <div key={i} className="dash-week-col">
                    <div
                        className="dash-week-bar"
                        style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                        title={`${d.count} activities`}
                    />
                    <div className="dash-week-day">{d.day}</div>
                </div>
            ))}
        </div>
    );
}

function SubjectBars({ data }) {
    if (!data || data.length === 0) return <p className="dash-empty-text">No activity yet</p>;
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="dash-subject-bars">
            {data.map((d, i) => (
                <div key={i} className="dash-subject-row">
                    <div className="dash-subject-name">{d.subject}</div>
                    <div className="dash-subject-bar-wrap">
                        <div
                            className="dash-subject-bar-fill"
                            style={{ width: `${(d.count / max) * 100}%` }}
                        />
                    </div>
                    <div className="dash-subject-count">{d.count}</div>
                </div>
            ))}
        </div>
    );
}

function ActivityFeed({ items }) {
    if (!items || items.length === 0) return <p className="dash-empty-text">No activity yet — start learning!</p>;
    return (
        <div className="dash-feed">
            {items.map((a, i) => {
                const meta = ACTIVITY_LABELS[a.type] || { icon: '📝', label: a.type };
                const time = new Date(a.timestamp + 'Z').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                    <div key={i} className="dash-feed-item">
                        <span className="dash-feed-icon">{meta.icon}</span>
                        <div className="dash-feed-body">
                            <div className="dash-feed-title">{meta.label} — {a.subject}</div>
                            {a.score != null && <div className="dash-feed-score">Score: {a.score}%</div>}
                            <div className="dash-feed-time">{time}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function Dashboard({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.id) { setLoading(false); return; }
        fetch(`${API_URL}/api/progress/${user.id}`)
            .then(r => r.json())
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => { setError('Could not load dashboard. Is the backend running?'); setLoading(false); });
    }, [user]);

    if (!user) {
        return (
            <div className="dash-empty">
                <div className="dash-empty-icon">🔒</div>
                <p>Please log in to see your progress dashboard.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <p>Loading your dashboard…</p>
            </div>
        );
    }

    if (error) {
        return <div className="dash-error">⚠️ {error}</div>;
    }

    const t = stats?.totals || {};
    const noActivity = t.messages === 0 && t.flashcard_sessions === 0 && t.voice_sessions === 0 && t.explanations === 0;

    return (
        <div className="dashboard">
            {/* Greeting */}
            <div className="dash-greeting">
                <h2>👋 Welcome back, <span className="dash-username">{user.username}</span>!</h2>
                <p className="dash-sub">
                    {noActivity
                        ? 'Start a chat, flip some flashcards, or try practice questions to see your stats here.'
                        : `You're on a ${t.streak || 0}-day streak 🔥 Keep going!`}
                </p>
            </div>

            {/* Stat cards */}
            <div className="dash-stats-grid">
                <StatCard icon="💬" label="Messages Sent" value={t.messages} color="#3b82f6" />
                <StatCard icon="🃏" label="Flashcard Sessions" value={t.flashcard_sessions} color="#6366f1"
                    sub={t.fc_accuracy != null ? `${t.fc_accuracy}% accuracy` : null} />
                <StatCard icon="🎤" label="Voice Sessions" value={t.voice_sessions} color="#8b5cf6" />
                <StatCard icon="📖" label="Explanations" value={t.explanations} color="#10b981" />
                <StatCard icon="✏️" label="Quiz Attempts" value={t.quiz_attempts}
                    sub={t.avg_quiz_score != null ? `Avg: ${t.avg_quiz_score}%` : null} color="#f59e0b" />
                <StatCard icon="🔥" label="Day Streak" value={t.streak} color="#ef4444"
                    sub={t.streak > 0 ? 'Keep it up!' : 'Start today!'} />
            </div>

            <div className="dash-two-col">
                {/* Week activity chart */}
                <div className="dash-panel">
                    <h3 className="dash-panel-title">📅 This Week</h3>
                    <WeekChart data={stats?.week_activity || []} />
                </div>

                {/* Subject breakdown */}
                <div className="dash-panel">
                    <h3 className="dash-panel-title">📚 Top Subjects</h3>
                    <SubjectBars data={stats?.subject_breakdown || []} />
                </div>
            </div>

            {/* Recent activity feed */}
            <div className="dash-panel dash-panel-full">
                <h3 className="dash-panel-title">⏱️ Recent Activity</h3>
                <ActivityFeed items={stats?.recent_activity || []} />
            </div>
        </div>
    );
}

export default Dashboard;

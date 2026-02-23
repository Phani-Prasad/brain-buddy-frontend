import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import AuthModal from './AuthModal';

const features = [
    { icon: '💬', title: 'Chat Tutor', desc: 'Ask questions and get step-by-step guidance', color: '#3b82f6' },
    { icon: '🎤', title: 'Voice Tutor', desc: 'Learn through natural voice conversations', color: '#8b5cf6' },
    { icon: '📖', title: 'Explain Topic', desc: 'Get clear explanations of any concept', color: '#10b981' },
    { icon: '✏️', title: 'Practice', desc: 'Test yourself with interactive questions', color: '#f59e0b' },
    { icon: '📄', title: 'AskMyDocs', desc: 'Upload study material and ask questions', color: '#ec4899' },
    { icon: '🃏', title: 'Flashcards', desc: 'Flip AI-generated cards to master key concepts', color: '#6366f1' },
];

const steps = [
    { num: '01', title: 'Choose your subject', desc: 'Pick from Math, Science, English, and more', icon: '📚' },
    { num: '02', title: 'Ask anything', desc: 'Type, speak, or upload your study material', icon: '💡' },
    { num: '03', title: 'Learn & grow', desc: 'Get guided explanations, practice, and master topics', icon: '🚀' },
];

const stats = [
    { value: 8, suffix: '+', label: 'Subjects' },
    { value: 6, suffix: '', label: 'Learning Modes' },
    { value: 24, suffix: '/7', label: 'Availability' },
    { value: 100, suffix: '%', label: 'Child Safe' },
];

const demoMessages = [
    { role: 'student', text: 'What is photosynthesis? 🌱', delay: 1200 },
    { role: 'buddy', text: 'Great question! Photosynthesis is how plants make their own food using sunlight. Think of leaves as tiny solar-powered kitchens! ☀️🍃', delay: 3000 },
    { role: 'student', text: 'So the leaf is like a solar panel?', delay: 5500 },
    { role: 'buddy', text: 'Exactly! 🎯 The chlorophyll in leaves captures sunlight, just like solar panels. Then it converts CO₂ + water into glucose (food) + oxygen. Want to try a practice question?', delay: 7500 },
];

const subjects = [
    { name: 'Mathematics', icon: '📐' },
    { name: 'Science', icon: '🔬' },
    { name: 'English', icon: '📚' },
    { name: 'History', icon: '🏛️' },
    { name: 'Geography', icon: '🌍' },
    { name: 'Programming', icon: '💻' },
    { name: 'Physics', icon: '⚛️' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Literature', icon: '📖' },
    { name: 'Economics', icon: '📊' },
    { name: 'Art', icon: '🎨' },
];

// Typing effect hook
function useTypingEffect(text, speed = 60, startDelay = 800) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        let i = 0;
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1));
                i++;
                if (i >= text.length) clearInterval(interval);
            }, speed);
            return () => clearInterval(interval);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [text, speed, startDelay]);
    return displayed;
}

// Counting animation hook
function useCountUp(target, duration = 1500, startDelay = 500) {
    const [count, setCount] = useState(0);
    const ref = useRef(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (ref.current) return;
            ref.current = true;
            const start = performance.now();
            const animate = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [target, duration, startDelay]);
    return count;
}

function StatItem({ value, suffix, label, delay }) {
    const count = useCountUp(value, 1200, delay);
    return (
        <div className="landing-stat">
            <div className="landing-stat-value">
                {count}<span className="landing-stat-suffix">{suffix}</span>
            </div>
            <div className="landing-stat-label">{label}</div>
        </div>
    );
}

function DemoChat() {
    const [visibleMessages, setVisibleMessages] = useState([]);
    const [showTyping, setShowTyping] = useState(false);

    useEffect(() => {
        setVisibleMessages([]);
        setShowTyping(false);

        const timers = [];
        demoMessages.forEach((msg) => {
            if (msg.role === 'buddy') {
                timers.push(setTimeout(() => setShowTyping(true), msg.delay - 800));
            }
            timers.push(setTimeout(() => {
                setShowTyping(false);
                setVisibleMessages(prev => [...prev, msg]);
            }, msg.delay));
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    return (
        <div className="demo-chat">
            <div className="demo-chat-header">
                <span className="demo-chat-dot red" />
                <span className="demo-chat-dot yellow" />
                <span className="demo-chat-dot green" />
                <span className="demo-chat-title">Brain Buddy Chat</span>
            </div>
            <div className="demo-chat-body">
                {visibleMessages.map((msg, i) => (
                    <div key={i} className={`demo-msg demo-msg-${msg.role}`}>
                        {msg.role === 'buddy' && <span className="demo-avatar">🧠</span>}
                        <div className={`demo-bubble demo-bubble-${msg.role}`}>{msg.text}</div>
                    </div>
                ))}
                {showTyping && (
                    <div className="demo-msg demo-msg-buddy">
                        <span className="demo-avatar">🧠</span>
                        <div className="demo-bubble demo-bubble-buddy demo-typing">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function LandingPage({ onEnter }) {
    const [exiting, setExiting] = useState(false);
    const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
    const tagline = useTypingEffect('Your AI-Powered Study Companion', 50, 600);

    const handleEnter = (loggedInUser) => {
        setExiting(true);
        window.scrollTo(0, 0);
        setTimeout(() => onEnter(loggedInUser), 600);
    };

    const openAuth = (mode) => setAuthModal(mode);
    const closeAuth = () => setAuthModal(null);

    const handleAuthSuccess = (user) => {
        closeAuth();
        handleEnter(user);
    };

    return (
        <div className={`landing-page ${exiting ? 'landing-exit' : ''}`}>
            {/* Auth Modal */}
            {authModal && (
                <AuthModal
                    initialMode={authModal}
                    onSuccess={handleAuthSuccess}
                    onClose={closeAuth}
                />
            )}

            {/* Animated background */}
            <div className="landing-bg-glow glow-1" />
            <div className="landing-bg-glow glow-2" />
            <div className="landing-bg-glow glow-3" />

            <div className="landing-particles">
                {[...Array(40)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                            width: `${3 + Math.random() * 6}px`,
                            height: `${3 + Math.random() * 6}px`,
                        }}
                    />
                ))}
            </div>

            {/* Orbital rings */}
            <div className="landing-orbit-ring ring-1" />
            <div className="landing-orbit-ring ring-2" />
            <div className="landing-orbit-ring ring-3" />

            {/* Navbar */}
            <nav className="landing-navbar">
                <div className="landing-navbar-logo">
                    <span className="landing-navbar-icon">🧠</span>
                    <span className="landing-navbar-name landing-gradient-text">Brain Buddy</span>
                </div>
                <div className="landing-navbar-actions">
                    <button className="landing-nav-login" onClick={() => openAuth('login')}>
                        Log In
                    </button>
                    <button className="landing-nav-signup" onClick={() => openAuth('register')}>
                        Sign Up
                    </button>
                </div>
            </nav>

            {/* Content */}
            <div className="landing-scroll-area">
                {/* Hero Section — Split Layout */}
                <section className="landing-hero">
                    <div className="landing-hero-text">
                        <p className="landing-tagline">
                            {tagline}<span className="typing-cursor">|</span>
                        </p>
                        <p className="landing-subtitle">
                            An intelligent AI tutor that adapts to your learning style, answers your questions, and helps you master any subject.
                        </p>
                    </div>
                    <div className="landing-hero-demo">
                        <DemoChat />
                    </div>
                </section>

                {/* Stats Section */}
                <section className="landing-stats">
                    {stats.map((s, i) => (
                        <StatItem key={i} value={s.value} suffix={s.suffix} label={s.label} delay={800 + i * 200} />
                    ))}
                </section>

                {/* Subjects Carousel */}
                <section className="landing-subjects-section">
                    <h2 className="landing-section-title">Subjects We Cover</h2>
                    <div className="subjects-track-wrapper">
                        <div className="subjects-track">
                            {[...subjects, ...subjects].map((s, i) => (
                                <div key={i} className="subject-pill">
                                    <span className="subject-pill-icon">{s.icon}</span>
                                    <span>{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="landing-features-section">
                    <h2 className="landing-section-title">Everything You Need to Learn</h2>
                    <div className="landing-features">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="landing-feature-card"
                                style={{ '--feature-color': f.color, animationDelay: `${0.3 + i * 0.08}s` }}
                            >
                                <div className="landing-feature-icon">{f.icon}</div>
                                <div className="landing-feature-info">
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How it Works */}
                <section className="landing-howit">
                    <h2 className="landing-section-title">How It Works</h2>
                    <div className="landing-steps">
                        {steps.map((s, i) => (
                            <div key={i} className="landing-step" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
                                <div className="landing-step-icon">{s.icon}</div>
                                <div className="landing-step-num">{s.num}</div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                                {i < steps.length - 1 && <div className="step-connector" />}
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="landing-cta-section">
                    <div className="landing-quote">
                        <span className="quote-mark">"</span>
                        The beautiful thing about learning is that nobody can take it away from you.
                        <span className="quote-mark">"</span>
                        <div className="quote-author">— B.B. King</div>
                    </div>

                    <button className="landing-cta" onClick={() => openAuth('register')}>
                        <span>Start Learning</span>
                        <span className="cta-rocket">🚀</span>
                    </button>

                    <div className="landing-safety-badge">
                        🛡️ Child-Safe AI &bull; Educational Content Only &bull; No Ads
                    </div>
                </section>
            </div>
        </div>
    );
}

export default LandingPage;

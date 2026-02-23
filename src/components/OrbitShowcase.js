import React, { useState } from 'react';
import './OrbitShowcase.css';

const features = [
    {
        id: 'chat',
        label: 'Chat Tutor',
        icon: '💬',
        color: '#8b5cf6',
        angle: -90,       // top
        description: 'Have real-time conversations with your AI tutor. Ask questions, get step-by-step guidance, and learn at your own pace.',
    },
    {
        id: 'voice',
        label: 'Voice Tutor',
        icon: '🎤',
        color: '#ec4899',
        angle: -18,        // top-right
        description: 'Speak your questions and hear AI responses. A hands-free, natural way to learn through voice interaction.',
    },
    {
        id: 'explain',
        label: 'Explain Topic',
        icon: '📖',
        color: '#06b6d4',
        angle: 54,         // bottom-right
        description: 'Get clear, structured explanations of any topic — from simple overviews to detailed deep-dives with examples.',
    },
    {
        id: 'practice',
        label: 'Practice',
        icon: '✏️',
        color: '#f59e0b',
        angle: 126,        // bottom-left
        description: 'Test your knowledge with AI-generated quizzes. Get hints, check answers, and track your progress.',
    },
    {
        id: 'study',
        label: 'AskMyDocs',
        icon: '📄',
        color: '#10b981',
        angle: 198,        // top-left
        description: 'Upload your study materials (PDF, DOCX, TXT) and ask questions, generate summaries, or create flashcards from your own notes.',
    },
];

const OrbitShowcase = () => {
    const [hoveredFeature, setHoveredFeature] = useState(null);

    const orbitRadius = 62; // px from center

    return (
        <div className="orbit-showcase">
            <div className="orbit-container">
                {/* Orbital ring */}
                <div className="orbit-ring"></div>
                <div className="orbit-ring orbit-ring-2"></div>

                {/* Connecting lines (decorative dots along the orbit) */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const dotAngle = i * 45;
                    const rad = (dotAngle * Math.PI) / 180;
                    const x = Math.cos(rad) * (orbitRadius + 8);
                    const y = Math.sin(rad) * (orbitRadius + 8);
                    return (
                        <div
                            key={`dot-${i}`}
                            className="orbit-dot"
                            style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                            }}
                        />
                    );
                })}

                {/* Center hub */}
                <div className="orbit-center">
                    <div className="orbit-center-icon">🧠</div>
                    <div className="orbit-center-text">Brain</div>
                    <div className="orbit-center-subtext">Buddy</div>
                </div>

                {/* Feature nodes */}
                {features.map((feature) => {
                    const rad = (feature.angle * Math.PI) / 180;
                    const x = Math.cos(rad) * orbitRadius;
                    const y = Math.sin(rad) * orbitRadius;
                    const isHovered = hoveredFeature === feature.id;

                    return (
                        <div
                            key={feature.id}
                            className={`orbit-node ${isHovered ? 'hovered' : ''}`}
                            style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                '--node-color': feature.color,
                            }}
                            onMouseEnter={() => setHoveredFeature(feature.id)}
                            onMouseLeave={() => setHoveredFeature(null)}
                        >
                            {/* Connecting line to center */}
                            <svg className="orbit-line" viewBox="0 0 200 200" preserveAspectRatio="none">
                                <line
                                    x1="100" y1="100"
                                    x2={100 - x * 0.7} y2={100 - y * 0.7}
                                    stroke={feature.color}
                                    strokeWidth="1"
                                    strokeOpacity={isHovered ? "0.6" : "0.2"}
                                    strokeDasharray="4 4"
                                />
                            </svg>

                            <div className="orbit-node-circle">
                                <span className="orbit-node-icon">{feature.icon}</span>
                            </div>
                            <span className="orbit-node-label">{feature.label}</span>

                            {/* Tooltip */}
                            {isHovered && (
                                <div className="orbit-tooltip">
                                    <div className="orbit-tooltip-title">
                                        {feature.icon} {feature.label}
                                    </div>
                                    <p>{feature.description}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrbitShowcase;

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ExplainTopic.css';
import { API_BASE } from '../config';

// Section definitions matching the headings the AI will produce
const SECTIONS = [
  { heading: '📖 Simple Definition', icon: '📖', label: 'Simple Definition', color: 'blue' },
  { heading: '🔑 Key Concepts', icon: '🔑', label: 'Key Concepts', color: 'purple' },
  { heading: '💡 Examples', icon: '💡', label: 'Examples', color: 'amber' },
  { heading: '⚠️ Common Mistakes', icon: '⚠️', label: 'Common Mistakes', color: 'red' },
  { heading: '🎯 Practice Tips', icon: '🎯', label: 'Practice Tips', color: 'green' },
];

/**
 * Parse fully-accumulated markdown into an array of section objects.
 * Returns [] while the response is still streaming (sections not yet complete).
 */
function parseSections(markdownText) {
  const sections = [];
  for (const sec of SECTIONS) {
    const headingRegex = new RegExp(`##\\s*${escapeRegex(sec.heading)}\\s*\\n`, 'i');
    const match = headingRegex.exec(markdownText);
    if (match) {
      const start = match.index + match[0].length;
      // Find where the next ## heading begins (or end of string)
      const nextHeading = /\n##\s+/g;
      nextHeading.lastIndex = start;
      const nextMatch = nextHeading.exec(markdownText);
      const end = nextMatch ? nextMatch.index : markdownText.length;
      sections.push({ ...sec, content: markdownText.slice(start, end).trim() });
    }
  }
  return sections;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ExplainTopic = ({ gradeLevel }) => {
  const [topic, setTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [streamText, setStreamText] = useState('');   // raw accumulated SSE text
  const [sections, setSections] = useState([]);   // parsed cards (shown when done)
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [topicLabel, setTopicLabel] = useState('');
  const abortRef = useRef(null);
  const streamRef = useRef('');

  // Once streaming finished, parse sections from accumulated text
  useEffect(() => {
    if (isDone && streamText) {
      const parsed = parseSections(streamText);
      if (parsed.length > 0) {
        setSections(parsed);
      }
    }
  }, [isDone, streamText]);

  const startExplain = async () => {
    if (!topic.trim() || isStreaming) return;

    // Reset state
    setStreamText('');
    setSections([]);
    setIsDone(false);
    setIsStreaming(true);
    setTopicLabel(topic.trim());
    streamRef.current = '';

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/explain/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          grade_level: gradeLevel || 'High School',
          detail_level: detailLevel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') {
            setIsStreaming(false);
            setIsDone(true);
            return;
          }
          if (payload.startsWith('[ERROR]:')) {
            console.error('Stream error:', payload);
            setIsStreaming(false);
            setIsDone(true);
            return;
          }
          // Unescape newlines
          const text = payload.replace(/\\n/g, '\n');
          streamRef.current += text;
          setStreamText(streamRef.current);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Explain stream error:', err);
      }
    } finally {
      setIsStreaming(false);
      setIsDone(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') startExplain();
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setStreamText('');
    setSections([]);
    setIsDone(false);
    setIsStreaming(false);
    setTopicLabel('');
  };

  const showCards = isDone && sections.length > 0;
  const showLiveStream = isStreaming || (isDone && sections.length === 0 && streamText);

  return (
    <div className="explain-topic">
      <h2>📖 Explain Any Topic</h2>
      <p className="subtitle">Get clear, detailed explanations tailored to your level</p>

      <div className="input-section">
        <input
          type="text"
          className="topic-input"
          placeholder="Enter a topic (e.g., Photosynthesis, Quadratic Equations)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isStreaming}
        />

        <div className="detail-selector">
          <label>Detail Level:</label>
          <div className="detail-buttons">
            {['simple', 'medium', 'detailed'].map((lvl) => (
              <button
                key={lvl}
                className={`detail-btn ${detailLevel === lvl ? 'active' : ''}`}
                onClick={() => setDetailLevel(lvl)}
                disabled={isStreaming}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="explain-actions">
          <button
            className="explain-btn"
            onClick={startExplain}
            disabled={isStreaming || !topic.trim()}
          >
            {isStreaming ? (
              <><span className="spinner" /> Generating…</>
            ) : '🔍 Explain'}
          </button>
          {(isStreaming || isDone) && (
            <button className="reset-btn" onClick={handleReset}>✕ Clear</button>
          )}
        </div>
      </div>

      {/* Live streaming preview — shown while tokens arrive */}
      {showLiveStream && (
        <div className="live-stream-card">
          <div className="live-stream-header">
            <span className="live-dot" />
            <span>{isStreaming ? 'Generating explanation…' : topicLabel}</span>
          </div>
          <div className="stream-markdown">
            <ReactMarkdown>{streamText || ''}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Section cards — shown after stream completes and sections parsed */}
      {showCards && (
        <div className="explanation-result">
          <div className="result-topic-header">
            <h3>💡 {topicLabel}</h3>
            <span className="grade-badge">{gradeLevel || 'High School'}</span>
          </div>
          <div className="section-cards">
            {sections.map((sec) => (
              <div key={sec.heading} className={`section-card section-card--${sec.color}`}>
                <div className="section-card-header">
                  <span className="section-icon">{sec.icon}</span>
                  <span className="section-label">{sec.label}</span>
                </div>
                <div className="section-card-body">
                  <ReactMarkdown>{sec.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplainTopic;

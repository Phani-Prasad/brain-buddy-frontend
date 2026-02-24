import React, { useState } from 'react';
import axios from 'axios';
import './ExplainTopic.css';
import { API_BASE } from '../config';

const ExplainTopic = ({ gradeLevel }) => {
  const [topic, setTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [explanation, setExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getExplanation = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/explain`, {
        topic: topic,
        grade_level: gradeLevel,
        detail_level: detailLevel
      });

      setExplanation(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          onKeyPress={(e) => e.key === 'Enter' && getExplanation()}
        />

        <div className="detail-selector">
          <label>Detail Level:</label>
          <div className="detail-buttons">
            <button
              className={`detail-btn ${detailLevel === 'simple' ? 'active' : ''}`}
              onClick={() => setDetailLevel('simple')}
            >
              Simple
            </button>
            <button
              className={`detail-btn ${detailLevel === 'medium' ? 'active' : ''}`}
              onClick={() => setDetailLevel('medium')}
            >
              Medium
            </button>
            <button
              className={`detail-btn ${detailLevel === 'detailed' ? 'active' : ''}`}
              onClick={() => setDetailLevel('detailed')}
            >
              Detailed
            </button>
          </div>
        </div>

        <button
          className="explain-btn"
          onClick={getExplanation}
          disabled={isLoading || !topic.trim()}
        >
          {isLoading ? '⏳ Loading...' : '🔍 Explain'}
        </button>
      </div>

      {explanation && (
        <div className="explanation-result">
          <h3>📚 {explanation.topic}</h3>
          <div className="explanation-content">
            {explanation.explanation}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplainTopic;

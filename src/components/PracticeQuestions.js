import React, { useState } from 'react';
import axios from 'axios';
import './PracticeQuestions.css';

const API_URL = 'http://localhost:8000';

const PracticeQuestions = ({ subject, gradeLevel }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState({});

  const generateQuestions = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/practice`, {
        subject: subject,
        topic: topic,
        difficulty: difficulty,
        num_questions: numQuestions
      });

      setQuestions(response.data.questions);
      setAnswers({});
      setShowAnswers({});
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = (index) => {
    setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="practice-questions">
      <h2>✏️ Practice Questions</h2>
      <p className="subtitle">Test your knowledge with AI-generated practice problems</p>

      <div className="practice-settings">
        <input
          type="text"
          className="topic-input"
          placeholder="Enter topic (e.g., Algebra, Grammar, Cells)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div className="settings-row">
          <div className="setting-group">
            <label>Difficulty:</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Questions:</label>
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={generateQuestions}
          disabled={isLoading || !topic.trim()}
        >
          {isLoading ? '⏳ Generating...' : '🎯 Generate Questions'}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="questions-list">
          {questions.map((q, index) => (
            <div key={index} className="question-card">
              <h3>Question {index + 1}</h3>
              <p className="question-text">{q.question}</p>

              {q.options && (
                <div className="options">
                  {q.options.map((opt, i) => (
                    <div key={i} className="option">{opt}</div>
                  ))}
                </div>
              )}

              {q.hints && (
                <div className="hints">
                  <p className="hints-title">💡 Hints:</p>
                  {q.hints.map((hint, i) => (
                    <div key={i} className="hint">{hint}</div>
                  ))}
                </div>
              )}

              <button
                className="check-btn"
                onClick={() => checkAnswer(index)}
              >
                {showAnswers[index] ? '✅ Hide Answer' : '🔍 Show Answer'}
              </button>

              {showAnswers[index] && (
                <div className="answer-section">
                  <p className="answer-label">✅ Answer:</p>
                  <p className="answer-text">{q.answer}</p>
                  <p className="explanation-label">📝 Explanation:</p>
                  <p className="explanation-text">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeQuestions;

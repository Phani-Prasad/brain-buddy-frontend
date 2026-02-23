import React from 'react';
import './SubjectSelector.css';

const subjects = [
  { id: 'math', name: 'Math', icon: '📐' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'english', name: 'English', icon: '📚' },
  { id: 'history', name: 'History', icon: '🏛️' },
  { id: 'programming', name: 'Programming', icon: '💻' },
  { id: 'physics', name: 'Physics', icon: '⚛️' },
];

const SubjectSelector = ({ selectedSubject, onSubjectChange }) => {
  return (
    <div className="subject-selector">
      {subjects.map(subject => (
        <button
          key={subject.id}
          className={`subject-btn ${selectedSubject === subject.id ? 'active' : ''}`}
          onClick={() => onSubjectChange(subject.id)}
        >
          <span className="subject-icon">{subject.icon}</span>
          <span className="subject-name">{subject.name}</span>
        </button>
      ))}
    </div>
  );
};

export default SubjectSelector;

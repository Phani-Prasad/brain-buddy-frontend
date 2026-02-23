import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

const API_URL = 'http://localhost:8000';

const ChatInterface = ({ sessionId, subject, gradeLevel, language, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const logActivity = (type, opts = {}) => {
    if (!userId) return;
    fetch(`${API_URL}/api/progress/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, activity_type: type, subject: subject || 'General', ...opts }),
    }).catch(() => { });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userInput = input.trim();
    setInput('');
    setIsStreaming(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);

    // Add empty assistant message that we'll fill token-by-token
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userInput,
          subject: subject,
          grade_level: gradeLevel,
          language: language || 'en',
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6); // strip "data: "

          if (payload.startsWith('[DONE]:')) {
            // Final metadata chunk
            try {
              const meta = JSON.parse(payload.slice(7));
              setMessages(prev => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                last.streaming = false;
                last.suggestions = meta.suggestions || [];
                last.resources = meta.resources || [];
                updated[updated.length - 1] = last;
                return updated;
              });
              logActivity('chat_message');
            } catch (_) { }
          } else if (payload.startsWith('[ERROR]:')) {
            setMessages(prev => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.content = '⚠️ Error: ' + payload.slice(8);
              last.streaming = false;
              updated[updated.length - 1] = last;
              return updated;
            });
          } else {
            // Normal token — unescape \n back to real newline
            const token = payload.replace(/\\n/g, '\n');
            setMessages(prev => {
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.content = (last.content || '') + token;
              updated[updated.length - 1] = last;
              return updated;
            });
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.content = '⚠️ Could not reach the server. Is the backend running?';
        last.streaming = false;
        updated[updated.length - 1] = last;
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    // Mark last message as done
    setMessages(prev => {
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.streaming = false;
      updated[updated.length - 1] = last;
      return updated;
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>👋 Hi! I'm your AI tutor</h2>
            <p>Ask me anything about {subject}. I'm here to help you learn!</p>
            <div className="quick-starts">
              <button onClick={() => setInput("Explain the basics")}>
                📚 Explain the basics
              </button>
              <button onClick={() => setInput("Give me practice problems")}>
                ✏️ Practice problems
              </button>
              <button onClick={() => setInput("I need help with homework")}>
                🤔 Help with homework
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🎓'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {msg.content}
                {msg.streaming && <span className="stream-cursor">▋</span>}
              </div>

              {!msg.streaming && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="suggestions">
                  <p className="suggestions-title">💡 You might also want to:</p>
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => setInput(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {!msg.streaming && msg.resources && msg.resources.length > 0 && (
                <div className="resources">
                  <p className="resources-title">📚 Resources:</p>
                  {msg.resources.map((res, i) => (
                    <div key={i} className="resource-item">{res}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          rows="3"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button className="send-btn stop-btn" onClick={stopStream}>
            ⏹ Stop
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            📤 Send
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

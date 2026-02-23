import React, { useState, useRef, useEffect } from 'react';
import './VoiceTutor.css';

const API_URL = 'http://localhost:8000';

function VoiceTutor({ sessionId, subject, gradeLevel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const startRecording = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioToServer(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            setError('Failed to start recording: ' + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToServer = async (audioBlob) => {
        setIsProcessing(true);
        setTranscript('');
        setResponse('');
        setAudioUrl(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('session_id', sessionId || 'voice-session');
            formData.append('subject', subject || 'General');
            formData.append('grade_level', gradeLevel || 'High School');

            const res = await fetch(`${API_URL}/api/voice/chat`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to process audio');
            }

            const data = await res.json();

            setTranscript(data.user_text);
            setResponse(data.assistant_text);

            // Add to conversation history
            setConversation(prev => [
                ...prev,
                { role: 'user', content: data.user_text },
                { role: 'assistant', content: data.assistant_text }
            ]);

            // Fetch and play the audio response
            if (data.audio_url) {
                const audioResponse = await fetch(`${API_URL}${data.audio_url}`);
                const audioBlob = await audioResponse.blob();
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Auto-play the response
                setTimeout(() => {
                    if (audioPlayerRef.current) {
                        audioPlayerRef.current.play();
                    }
                }, 100);
            }
        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAudioPlay = () => {
        setIsPlaying(true);
    };

    const handleAudioPause = () => {
        setIsPlaying(false);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    return (
        <div className="voice-tutor">
            <div className="voice-header">
                <h2>🎤 Voice Tutor</h2>
                <p>Click the microphone to ask a question</p>
            </div>

            <div className="voice-controls">
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                >
                    {isRecording ? (
                        <>
                            <span className="pulse"></span>
                            <span className="mic-icon">⏹️</span>
                            <span>Stop Recording</span>
                        </>
                    ) : (
                        <>
                            <span className="mic-icon">🎤</span>
                            <span>Start Recording</span>
                        </>
                    )}
                </button>

                {isProcessing && (
                    <div className="processing-indicator">
                        <div className="spinner"></div>
                        <span>Processing your question...</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {transcript && (
                <div className="transcript-section">
                    <h3>You said:</h3>
                    <p className="transcript">{transcript}</p>
                </div>
            )}

            {response && (
                <div className="response-section">
                    <h3>AI Tutor:</h3>
                    <p className="response">{response}</p>

                    {audioUrl && (
                        <div className="audio-player">
                            <audio
                                ref={audioPlayerRef}
                                src={audioUrl}
                                controls
                                onPlay={handleAudioPlay}
                                onPause={handleAudioPause}
                                onEnded={handleAudioEnded}
                            />
                            <span className="audio-status">
                                {isPlaying ? '🔊 Playing...' : '🔇 Click to play'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {conversation.length > 0 && (
                <div className="conversation-history">
                    <h3>Conversation History</h3>
                    <div className="messages">
                        {conversation.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <strong>{msg.role === 'user' ? 'You' : 'AI Tutor'}:</strong>
                                <p>{msg.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="voice-tips">
                <h4>💡 Tips for best results:</h4>
                <ul>
                    <li>Speak clearly and at a normal pace</li>
                    <li>Minimize background noise</li>
                    <li>Ask specific questions about your topic</li>
                    <li>Wait for the response before asking the next question</li>
                </ul>
            </div>
        </div>
    );
}

export default VoiceTutor;

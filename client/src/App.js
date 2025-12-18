import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiFileText, FiX, FiMessageSquare, FiSend, FiAward, FiSun, FiMoon } from 'react-icons/fi';
import './App.css';

const App = () => {
    const [showLanding, setShowLanding] = useState(true);
    const [jdText, setJdText] = useState('');
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState('dark');

    useEffect(() => { document.body.className = theme; }, [theme]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Upload Resume!");
        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jdText', jdText);
        try {
            const res = await axios.post('http://localhost:5000/analyze', formData);
            setResult(res.data);
        } catch { alert("Analysis Failed"); } finally { setLoading(false); }
    };

    if (showLanding) {
        const letters = "SKILLSYNC".split("");
        return (
            <div className="landing-wrapper">
                <div className="live-wallpaper-bg"></div>
                <div className="landing-content">
                    <div className="logo-3d-container">
                        {letters.map((char, i) => (
                            <span 
                                key={i} 
                                className="letter-3d" 
                                style={{ "--idx": i, "--total": letters.length }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    <button className="start-btn" onClick={() => setShowLanding(false)}>
                        START YOUR JOURNEY
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`app-wrapper ${theme}`}>
            <nav className="glass-nav">
                <div className="nav-side nav-left"></div>
                <div className="nav-center">
                    <div className="logo-container">
                        <img src="/logo.png" alt="" className="nav-logo" />
                        <h1 className="logo-text">SKILL<span>SYNC</span></h1>
                    </div>
                </div>
                <div className="nav-side nav-right">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="theme-toggle">
                        {theme === 'dark' ? <FiSun /> : <FiMoon />}
                    </button>
                </div>
            </nav>

            <main className="dashboard">
                <div className="glass-card input-panel">
                    <h3 className="analysis-context-heading">Analysis Context</h3>
                    <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste Job Description..." />
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                    <button onClick={handleSubmit} className="glow-button" disabled={loading}>RUN ANALYSIS</button>
                </div>
                <div className="glass-card results-panel">
                    {result ? (
                        <div className="results-inner">
                            <div className="score-ring"><h1>{result.score}%</h1></div>
                            <div className="tag-container">
                                <h4>Matched Skills</h4> 
                                {result.analysis.hardSkills.matched.map(s => <span key={s} className="tag match">{s}</span>)}
                                <h4 style={{marginTop: '20px'}}>Missing Skills</h4> 
                                {result.analysis.hardSkills.missing.map(s => <span key={s} className="tag miss">{s}</span>)}
                            </div>
                        </div>
                    ) : <div className="empty-state"><FiAward size={50} /><p>Ready for sync...</p></div>}
                </div>
            </main>
            <Chatbot analysisResult={result} />
        </div>
    );
};

const Chatbot = ({ analysisResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ 
        sender: 'bot', 
        text: "• Hello! I'm SkillSync AI.\n• Ready to optimize your resume?\n• Ask me about your missing skills." 
    }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

    const sendMessage = async () => {
        if (!input.trim() || isTyping) return;
        const userText = input;
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setInput(''); 
        setIsTyping(true);

        const prompt = analysisResult 
            ? `Resume Score: ${analysisResult.score}%. Missing: ${analysisResult.analysis.hardSkills.missing.join(', ')}. Question: ${userText}` 
            : userText;

        try {
            const res = await axios.post('http://localhost:5000/api/chat', { prompt });
            setMessages(prev => [...prev, { sender: 'bot', text: res.data.text }]);
        } catch {
            setMessages(prev => [...prev, { sender: 'bot', text: "• Service is currently limited.\n• We hit the free tier quota.\n• Try again shortly." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="bot-anchor">
            <button className="bot-trigger" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FiX /> : <FiMessageSquare />}
            </button>
            
            {isOpen && (
                <div className="bot-window">
                    <div className="bot-header">
                        <div className="bot-status-dot"></div>
                        <span>SkillSync AI Assistant</span>
                    </div>

                    <div className="bot-chat">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble ${m.sender}`}>
                                {m.text}
                            </div>
                        ))}
                        {isTyping && <div className="chat-bubble bot typing">Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="bot-input-area">
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                            placeholder="Ask SkillSync..." 
                        />
                        <button onClick={sendMessage} className="bot-send-btn">
                            <FiSend />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
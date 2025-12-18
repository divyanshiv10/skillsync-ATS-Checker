require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer'); 
const pdfParse = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors()); 
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() }); 


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
    },
});

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    try {
        const chatPrompt = `You are the SkillSync AI Assistant. 
        Format your answer using the following rules:
        - Use "•" for every single point.
        - Provide exactly 3-4 professional points.
        - Keep language concise and career-focused.

        User Context: ${prompt}`;

        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        res.json({ text: response.text().trim() });
    } catch (error) {
        console.error("Gemini Error:", error);
        if (error.status === 429) {
            res.status(429).json({ text: "• Daily limit reached (Dec 2025 update).\n• Free tier allows ~20 requests daily.\n• Quota resets at midnight PT." });
        } else {
            res.status(500).json({ text: "• AI service is temporarily unavailable.\n• Please try again in 30 seconds." });
        }
    }
});

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text.toLowerCase();
        const jdText = req.body.jdText ? req.body.jdText.toLowerCase() : "";
        const filler = new Set(['the', 'and', 'with', 'from', 'this', 'that']);
        const jdKeywords = jdText.split(/\W+/).filter(word => word.length > 3 && !filler.has(word));
        const matched = jdKeywords.filter(word => resumeText.includes(word));
        const missing = jdKeywords.filter(word => !resumeText.includes(word));
        const score = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

        res.json({ 
            score: Math.min(score, 100), 
            analysis: { 
                hardSkills: { 
                    matched: [...new Set(matched)].map(s => s.toUpperCase()).slice(0, 8), 
                    missing: [...new Set(missing)].map(s => s.toUpperCase()).slice(0, 8) 
                }
            } 
        });
    } catch (err) { 
        res.status(500).json({ message: "Analysis failed" }); 
    }
});

app.listen(5000, () => console.log(`🚀 SkillSync Backend Live | Dec 2025 Stable`));
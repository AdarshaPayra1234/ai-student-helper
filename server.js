// =============================================
// REAL AI STUDENT HELPER - REPLIT 1GB RAM
// =============================================

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Global variable to track Ollama status
let ollamaReady = false;
let ollamaProcess = null;

// Start Ollama when server starts
console.log('🚀 Starting Ollama AI engine...');
startOllama();

function startOllama() {
  ollamaProcess = exec('ollama serve', (error, stdout, stderr) => {
    if (error) {
      console.error('Ollama error:', error);
    }
  });

  // Wait for Ollama to start, then pull models
  setTimeout(() => {
    console.log('📥 Downloading AI models...');
    
    // Download lightweight models that fit in 1GB RAM
    exec('ollama pull phi3:mini', (error, stdout, stderr) => {
      if (!error) {
        console.log('✅ Phi-3 Mini downloaded successfully');
        ollamaReady = true;
      }
    });
    
    exec('ollama pull tinyllama', (error, stdout, stderr) => {
      if (!error) {
        console.log('✅ TinyLlama downloaded successfully');
        ollamaReady = true;
      }
    });
    
  }, 5000);
}

// Real AI chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    console.log('🤔 AI Question:', message.substring(0, 100));

    if (!ollamaReady) {
      return res.json({
        success: true,
        response: \`I understand: "\${message}"\n\n🔄 **AI System is Starting Up**\n\nThe real AI engine is loading (takes 2-3 minutes on first run).\n\n📚 **In the meantime, here's how to approach this:**\n\n1. Break down the problem into smaller parts\n2. Research each component systematically\n3. Apply critical thinking to connect concepts\n4. Verify your understanding through practice\n\n💡 The AI will be ready shortly for detailed assistance!\`,
        aiReady: false,
        loading: true
      });
    }

    // Try to use Ollama via HTTP
    try {
      const axios = require('axios');
      
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'phi3:mini',
        prompt: \`You are a helpful student assistant. Provide detailed, educational responses to student questions. Be thorough but clear.

Question: \${message}

Answer:\`,
        stream: false
      }, {
        timeout: 30000
      });

      const aiResponse = response.data.response;

      res.json({
        success: true,
        response: aiResponse,
        model: 'phi3-mini',
        realAI: true,
        memory: (process.memoryUsage().rss / 1024 / 1024).toFixed(1) + 'MB'
      });

    } catch (ollamaError) {
      console.log('Ollama direct call failed, using fallback');
      // Fallback to system call
      useOllamaFallback(message, res);
    }

  } catch (error) {
    console.error('AI chat error:', error);
    res.json({
      success: true,
      response: generateProfessionalFallback(req.body.message),
      fallback: true,
      realAI: false
    });
  }
});

// Fallback Ollama method
function useOllamaFallback(message, res) {
  const ollama = exec(\`echo '\${message.replace(/'/g, '"')}' | ollama run phi3:mini\`, 
    { timeout: 30000 }, 
    (error, stdout, stderr) => {
      if (error) {
        console.error('Ollama fallback error:', error);
        res.json({
          success: true,
          response: generateProfessionalFallback(message),
          fallback: true
        });
      } else {
        res.json({
          success: true,
          response: stdout,
          model: 'phi3-mini',
          realAI: true
        });
      }
    }
  );
}

// Professional fallback generator
function generateProfessionalFallback(message) {
  const responses = {
    math: \`🔢 **Mathematical Analysis**: "\${message}"\n\n**Learning Framework:**\n• Conceptual understanding before calculation\n• Step-by-step problem decomposition\n• Multiple solution approaches\n• Real-world application contexts\n\n**Next Steps:**\n1. Identify core mathematical principles\n2. Apply systematic problem-solving\n3. Verify results through alternative methods\n4. Extend understanding to related concepts\`,

    science: \`🔬 **Scientific Inquiry**: "\${message}"\n\n**Investigation Methodology:**\n• Hypothesis formulation and testing\n• Evidence-based reasoning\n• Experimental design principles\n• Interdisciplinary connections\n\n**Scientific Process:**\n1. Observation and question formulation\n2. Background research and literature review\n3. Hypothesis development\n4. Experimental design and execution\n5. Data analysis and interpretation\n6. Conclusion and further questions\`,

    programming: \`💻 **Computational Thinking**: "\${message}"\n\n**Development Strategy:**\n• Algorithm design and optimization\n• Code readability and maintainability\n• Debugging methodology\n• Version control practices\n\n**Programming Workflow:**\n1. Problem analysis and requirements gathering\n2. Algorithm design and pseudocode\n3. Implementation and testing\n4. Refactoring and optimization\n5. Documentation and deployment\`,

    writing: \`✍️ **Academic Writing**: "\${message}"\n\n**Composition Framework:**\n• Thesis development and argument structure\n• Evidence integration and citation\n• Rhetorical strategy and audience awareness\n• Revision and editing protocols\n\n**Writing Process:**\n1. Research and source evaluation\n2. Outline and structure planning\n3. Draft composition\n4. Peer review and feedback integration\n5. Final editing and formatting\`,

    general: \`🎓 **Academic Assistance**: "\${message}"\n\n**Learning Optimization:**\n• Active learning techniques\n• Information synthesis methods\n• Critical thinking development\n• Knowledge application strategies\n\n**Study Protocol:**\n1. Pre-assessment of current understanding\n2. Targeted knowledge acquisition\n3. Practical application exercises\n4. Self-assessment and gap identification\n5. Reinforcement and mastery development\`
  };

  const lowerMsg = message.toLowerCase();
  let category = 'general';
  
  if (lowerMsg.includes('math') || lowerMsg.includes('calculate')) category = 'math';
  else if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry')) category = 'science';
  else if (lowerMsg.includes('programming') || lowerMsg.includes('code')) category = 'programming';
  else if (lowerMsg.includes('write') || lowerMsg.includes('essay')) category = 'writing';

  return responses[category];
}

// System status endpoint
app.get('/api/status', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'operational',
    aiReady: ollamaReady,
    memory: {
      used: (memory.rss / 1024 / 1024).toFixed(1) + 'MB',
      total: '1024MB',
      free: (1024 - (memory.rss / 1024 / 1024)).toFixed(1) + 'MB'
    },
    models: ollamaReady ? ['phi3:mini', 'tinyllama'] : ['loading...'],
    platform: 'Replit (1GB RAM)'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`💾 RAM: 1GB (Replit)\`);
  console.log(\`🤖 AI Models: Phi-3 Mini, TinyLlama\`);
  console.log(\`🌐 URL: https://\${process.env.REPL_SLUG}.\${process.env.REPL_OWNER}.repl.co\`);
});
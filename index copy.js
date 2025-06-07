const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* -------- OpenAI -------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* -------- Cargar contexto -------- */
let contextoCursos = '';
try {
  contextoCursos = fs.readFileSync(
    path.join(__dirname, 'cursos_personalizados.json'),   // ← cambio 1
    'utf-8'
  );
  console.log('✔️  Contexto cargado');
} catch (err) {
  console.warn('⚠️  No se pudo cargar cursos_personalizados.json');
}

/* -------- Endpoint chatbot -------- */
app.post('/api/chat', async (req, res) => {                  // ← cambio 3
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: 'Mensaje vacío' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',                                       // opcional: usar modelo + nuevo
      messages: [
        { role: 'system', content: `Sos un asistente especializado...` },
        { role: 'system', content: contextoCursos },
        { role: 'user', content: userMessage }
      ]
    });
    res.json({ message: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar respuesta' });
  }
});

/* -------- SPA fallback -------- */
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

/* -------- Iniciar servidor -------- */
const PORT = process.env.PORT || 10000;                      // ← cambio 2
app.listen(PORT, () => console.log(`🚀 Servidor en ${PORT}`));

const express = require('express');
const path     = require('path');
const dotenv   = require('dotenv');
const OpenAI   = require('openai');
const fs       = require('fs');

/* ---------- Variables de entorno ---------- */
dotenv.config();

/* ---------- App ---------- */
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));   // sirve Angular

/* ---------- OpenAI ---------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- Contexto cursos ---------- */
let contextoCursos = '';
try {
  contextoCursos = fs.readFileSync(
    path.join(__dirname, 'cursos_personalizados.json'),   // mismo folder
    'utf-8'
  );
  console.log('✔️  Contexto cargado');
} catch {
  console.warn('⚠️  No se pudo cargar cursos_personalizados.json');
}

/* ---------- Endpoint chatbot ---------- */
app.post('/api/chat', async (req, res) => {                // <- nuevo path
  const userMessage = (req.body.message || '').trim();
  if (!userMessage) return res.status(400).json({ error: 'Mensaje vacío' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',                              // mismo modelo
      messages: [
        {
          role: 'system',
          content: `Sos un asistente especializado en responder exclusivamente preguntas sobre los cursos de formación laboral ofrecidos por el Ministerio de Trabajo de la provincia de Jujuy. 
Podés ayudar a las personas a:
- conocer qué cursos hay disponibles,
- entender sus contenidos, modalidades, requisitos e inscripción,
- recibir recomendaciones de cursos según su perfil o necesidades.

Ignorá preguntas que no estén relacionadas con esos cursos. Si alguien pregunta sobre historia, política, farándula, salud, ciencia u otro tema no vinculado, respondé educadamente:

"Lo siento, solo puedo responder consultas sobre los cursos dictados por el gobierno de la provincia de Jujuy. Por favor, preguntá algo relacionado con los cursos."

No respondas temas generales de cultura, educación u orientación vocacional fuera de estos cursos.`
        },
        { role: 'system', content: contextoCursos },
        { role: 'user',   content: userMessage }
      ]
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ message: aiResponse });
  } catch (err) {
    console.error('Error al generar respuesta:', err);
    res.status(500).json({ error: 'Error al generar respuesta' });
  }
});

/* ---------- Fallback SPA ---------- */
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

/* ---------- Lanzar servidor ---------- */
const PORT = process.env.PORT || 10000;                     // 10000 local / Render
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);

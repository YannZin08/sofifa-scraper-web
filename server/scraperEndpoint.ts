import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const scraperRouter = Router();

scraperRouter.post('/extract', (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'URL é obrigatória',
      players: []
    });
  }

  // Validar se é uma URL do SoFIFA
  if (!url.includes('sofifa.com')) {
    return res.status(400).json({
      success: false,
      error: 'A URL deve ser do site sofifa.com',
      players: []
    });
  }

  // Chamar o script Python
  const pythonProcess = spawn('python3', [
    path.join(process.cwd(), 'server', 'scraper.py'),
    url
  ]);

  let output = '';
  let errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: `Erro ao executar o scraper: ${errorOutput}`,
        players: []
      });
    }

    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (parseError) {
      res.status(500).json({
        success: false,
        error: 'Erro ao processar resposta do scraper',
        players: []
      });
    }
  });

  pythonProcess.on('error', (err) => {
    res.status(500).json({
      success: false,
      error: `Erro ao iniciar o scraper: ${err.message}`,
      players: []
    });
  });
});

export default scraperRouter;

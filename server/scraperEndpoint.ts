import { Router } from 'express';
import { scrapeSofifaPlayersBatch } from './scraperService';

const scraperRouter = Router();

// Endpoint de extração em lote com streaming SSE (Server-Sent Events)
// Permite enviar dados em tempo real sem timeout
scraperRouter.post('/extract-batch-stream', async (req, res) => {
  const { baseUrl, startOffset, endOffset, step } = req.body;

  if (!baseUrl || typeof baseUrl !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'baseUrl é obrigatória',
    });
  }

  if (typeof startOffset !== 'number' || typeof endOffset !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'startOffset e endOffset devem ser números',
    });
  }

  // Validar se é uma URL do SoFIFA
  if (!baseUrl.includes('sofifa.com')) {
    return res.status(400).json({
      success: false,
      error: 'A URL deve ser do site sofifa.com',
    });
  }

  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Executar extração
    const result = await scrapeSofifaPlayersBatch(baseUrl, startOffset, endOffset, step || 60);

    if (result.success) {
      // Enviar dados em chunks
      const chunkSize = 50; // Enviar 50 jogadores por vez
      for (let i = 0; i < result.players.length; i += chunkSize) {
        const chunk = result.players.slice(i, i + chunkSize);
        const progress = Math.min(i + chunkSize, result.players.length);
        
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          progress,
          total: result.players.length,
          players: chunk,
        })}\n\n`);

        // Pequeno delay para evitar sobrecarregar o cliente
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Enviar conclusão
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        success: true,
        count: result.players.length,
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        success: false,
        error: result.error,
      })}\n\n`);
    }

    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.write(`data: ${JSON.stringify({
      type: 'error',
      success: false,
      error: errorMessage,
    })}\n\n`);
    res.end();
  }
});

export default scraperRouter;

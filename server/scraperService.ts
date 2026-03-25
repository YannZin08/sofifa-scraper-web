import axios from 'axios';
import { load } from 'cheerio';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface Player {
  nome: string;
  idade: number | string;
  overall: number | string;
  potencial: number | string;
  time: string;
  posicoes: string[];
}

interface ScraperResult {
  success: boolean;
  error: string | null;
  players: Player[];
  count?: number;
}

// Lista de proxies públicos gratuitos (podem ser instáveis)
const PROXY_LIST = [
  'http://proxy.example.com:8080', // Placeholder - será substituído por proxies reais se necessário
];

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Tentar sem proxy primeiro
      if (attempt === 0) {
        const response = await axios.get(url, {
          headers,
          timeout: 15000,
          maxRedirects: 5,
        });
        return response.data;
      }

      // Se falhar, tentar com diferentes estratégias
      if (attempt === 1) {
        // Tentar com referer
        const response = await axios.get(url, {
          headers: {
            ...headers,
            'Referer': 'https://sofifa.com/',
          },
          timeout: 15000,
          maxRedirects: 5,
        });
        return response.data;
      }

      // Tentar com cookie session simulado
      if (attempt === 2) {
        const response = await axios.get(url, {
          headers: {
            ...headers,
            'Referer': 'https://sofifa.com/',
            'Cookie': 'session=dummy; path=/',
          },
          timeout: 15000,
          maxRedirects: 5,
        });
        return response.data;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw new Error('Todas as tentativas falharam');
}

export async function scrapeSofifaPlayers(url: string): Promise<ScraperResult> {
  try {
    // Validar URL
    if (!url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'A URL deve ser do site sofifa.com',
        players: []
      };
    }

    let html: string;
    try {
      html = await fetchWithRetry(url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Se for erro 403, tentar com estratégia alternativa
      if (errorMsg.includes('403')) {
        return {
          success: false,
          error: 'O SoFIFA está bloqueando requisições. Tente novamente em alguns segundos ou use um VPN.',
          players: []
        };
      }

      return {
        success: false,
        error: `Erro ao acessar a URL: ${errorMsg}`,
        players: []
      };
    }

    const $ = load(html);
    const tbody = $('tbody');

    if (tbody.length === 0) {
      return {
        success: false,
        error: 'Tabela não encontrada. Verifique se a URL do SoFIFA está correta.',
        players: []
      };
    }

    const players: Player[] = [];
    const rows = $('tbody tr');

    rows.each((_, row) => {
      try {
        const cells = $(row).find('td');
        if (cells.length < 6) return;

        // Nome
        const nameCell = $(cells[1]);
        const nameTag = nameCell.find('a').first();
        if (nameTag.length === 0) return;
        const name = nameTag.text().trim();

        // Posições
        const positions: string[] = [];
        nameCell.find('a[rel="nofollow"]').each((_, link) => {
          const text = $(link).text().trim();
          if (text.length > 0 && text.length <= 3 && /^[A-Z]+$/.test(text)) {
            positions.push(text);
          }
        });

        // Idade
        const ageText = $(cells[2]).text().trim();
        const age = /^\d+$/.test(ageText) ? parseInt(ageText) : ageText;

        // Overall
        const overallText = $(cells[3]).text().trim();
        const overall = /^\d+$/.test(overallText) ? parseInt(overallText) : overallText;

        // Potencial
        const potentialText = $(cells[4]).text().trim();
        const potential = /^\d+$/.test(potentialText) ? parseInt(potentialText) : potentialText;

        // Time
        const teamCell = $(cells[5]);
        const teamTag = teamCell.find('a').first();
        const team = teamTag.length > 0 ? teamTag.text().trim() : 'Free Agent';

        const player: Player = {
          nome: name,
          idade: age,
          overall,
          potencial: potential,
          time: team,
          posicoes: positions
        };

        players.push(player);
      } catch (err) {
        // Continua mesmo se uma linha falhar
        console.error('Erro ao processar linha:', err);
      }
    });

    if (players.length === 0) {
      return {
        success: false,
        error: 'Nenhum jogador encontrado na página. A página pode estar vazia ou o formato pode ter mudado.',
        players: []
      };
    }

    return {
      success: true,
      error: null,
      players,
      count: players.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      error: `Erro durante a extração: ${errorMessage}`,
      players: []
    };
  }
}

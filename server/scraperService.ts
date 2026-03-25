import axios, { AxiosError } from 'axios';
import { load } from 'cheerio';

// Mapeamento de posicoes do ingles para portugues abreviado conforme padroes do site
const POSITION_TRANSLATIONS: Record<string, string> = {
  'GK': 'GOL',
  'CB': 'ZAG',
  'LB': 'LE',
  'RB': 'LD',
  'LWB': 'ADE',
  'RWB': 'ADD',
  'CM': 'MC',
  'CDM': 'VOL',
  'CAM': 'PE',
  'LM': 'ME',
  'RM': 'MD',
  'LCM': 'MC',
  'RCM': 'MC',
  'LDM': 'VOL',
  'RDM': 'VOL',
  'LAM': 'PE',
  'RAM': 'PE',
  'MEI': 'MEI',
  'ME': 'ME',
  'MD': 'MD',
  'ST': 'ATA',
  'CF': 'ATA',
  'LW': 'PE',
  'RW': 'PE',
  'LF': 'SA',
  'RF': 'SA',
  'ATA': 'ATA',
  'AT': 'ATA',
  'EE': 'PE',
  'ED': 'PE',
  'SA': 'SA',
  'PD': 'PD',
};

function translatePosition(position: string): string {
  return POSITION_TRANSLATIONS[position] || position;
}

interface Player {
  nome: string;
  idade: number | string;
  overall: number | string;
  potencial: number | string;
  time: string;
  posicoes: string[];
  imagem?: string;
  valorMercado?: string;
}

interface ScraperResult {
  success: boolean;
  error: string | null;
  players: Player[];
  count?: number;
}

// Lista de User-Agents para rotacionar
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Lista de proxies públicos para contornar bloqueios
const PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
];

function getRandomProxy(): string {
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

async function fetchPageWithRetry(url: string, maxRetries: number = 5): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
      if (attempt > 0) {
        console.log(`Tentativa ${attempt + 1}/${maxRetries} após ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Usar proxy a partir da segunda tentativa
      let requestUrl = url;
      if (attempt >= 1) {
        const proxy = getRandomProxy();
        requestUrl = proxy + encodeURIComponent(url);
        console.log(`Tentativa ${attempt + 1}: Usando proxy`);
      }

      const response = await axios.get(requestUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'Referer': 'https://sofifa.com/',
        },
        timeout: 30000,
        validateStatus: (status) => status < 500, // Não lançar erro para 4xx
      });

      if (response.status === 403) {
        lastError = new Error('O SoFIFA está bloqueando requisições. Tente novamente em alguns segundos ou use um VPN.');
        continue;
      }

      if (response.status !== 200) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries - 1) {
        break;
      }
    }
  }

  throw lastError || new Error('Falha ao acessar a URL após múltiplas tentativas');
}

function extractPlayers(html: string): Player[] {
  const $ = load(html);
  const players: Player[] = [];

  try {
    // Encontrar todas as linhas da tabela
    $('tbody tr').each((_, row) => {
      try {
        const $row = $(row);
        
        // Extrair dados básicos
        const nome = $row.find('td:nth-child(2) a')?.text()?.trim() || '';
        const idade = $row.find('td:nth-child(3)')?.text()?.trim() || '';
        const overall = $row.find('td:nth-child(4)')?.text()?.trim() || '';
        const potencial = $row.find('td:nth-child(5)')?.text()?.trim() || '';
        const time = $row.find('td:nth-child(6) a')?.text()?.trim() || '';
        
        // Extrair posições
        const posicoesText = $row.find('td:nth-child(7)')?.text()?.trim() || '';
        const posicoes = posicoesText
          .split(',')
          .map(p => p.trim())
          .filter(p => p)
          .map(p => translatePosition(p));

        // Extrair imagem
        const imagem = $row.find('td:nth-child(2) img')?.attr('data-src') || 
                       $row.find('td:nth-child(2) img')?.attr('src') || 
                       undefined;

        // Extrair valor de mercado
        const valorMercado = $row.find('td:nth-child(8)')?.text()?.trim() || undefined;

        // Validar dados obrigatórios
        if (nome && overall) {
          players.push({
            nome,
            idade: isNaN(Number(idade)) ? idade : Number(idade),
            overall: isNaN(Number(overall)) ? overall : Number(overall),
            potencial: isNaN(Number(potencial)) ? potencial : Number(potencial),
            time,
            posicoes,
            imagem,
            valorMercado,
          });
        }
      } catch (err) {
        console.error('Erro ao processar linha da tabela:', err);
      }
    });
  } catch (err) {
    console.error('Erro ao extrair jogadores:', err);
  }

  return players;
}

export async function scrapeSofifaPlayers(url: string): Promise<ScraperResult> {
  try {
    // Validar URL
    if (!url || !url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        players: [],
      };
    }

    console.log(`Iniciando scraping de: ${url}`);

    // Buscar a página com retry
    const html = await fetchPageWithRetry(url);

    // Extrair jogadores
    const players = extractPlayers(html);

    if (players.length === 0) {
      return {
        success: false,
        error: 'Nenhum jogador encontrado. A página pode estar vazia ou a estrutura do SoFIFA pode ter mudado.',
        players: [],
      };
    }

    return {
      success: true,
      error: null,
      players,
      count: players.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper:', errorMessage);

    return {
      success: false,
      error: `Erro ao acessar página: ${errorMessage}`,
      players: [],
    };
  }
}

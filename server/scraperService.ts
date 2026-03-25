import axios from 'axios';
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

// Lista expandida de User-Agents para rotacionar
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Simular comportamento de usuário real com delays variáveis
async function randomDelay(min: number = 500, max: number = 2000): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

async function fetchPageWithScraperAPI(url: string): Promise<string> {
  const apiKey = process.env.SCRAPER_API_KEY;
  
  if (!apiKey) {
    throw new Error('SCRAPER_API_KEY não configurada. Usando fallback sem proxy.');
  }

  try {
    console.log('Usando ScraperAPI para contornar bloqueios...');
    
    const scraperApiUrl = 'https://api.scraperapi.com';
    const params = {
      api_key: apiKey,
      url: url,
      render: 'false', // Não precisa renderizar JavaScript
    };

    const response = await axios.get(scraperApiUrl, {
      params,
      timeout: 60000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 403) {
      throw new Error('ScraperAPI também foi bloqueado. Tente novamente em alguns minutos.');
    }

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro ao usar ScraperAPI:', errorMessage);
    throw error;
  }
}

async function fetchPageWithRetry(url: string, maxRetries: number = 3): Promise<string> {
  let lastError: Error | null = null;

  // Tentar com ScraperAPI primeiro
  try {
    return await fetchPageWithScraperAPI(url);
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.log('ScraperAPI falhou, tentando sem proxy...');
  }

  // Fallback: tentar sem proxy com retry
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const baseDelay = Math.min(2000 * Math.pow(1.5, attempt - 1), 15000);
        const randomVariation = Math.random() * 2000 - 1000;
        const totalDelay = Math.max(1000, baseDelay + randomVariation);
        
        console.log(`Tentativa ${attempt + 1}/${maxRetries} após ${Math.round(totalDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }

      const headers = {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Referer': 'https://www.google.com/',
      };

      const response = await axios.get(url, {
        headers,
        timeout: 45000,
        validateStatus: (status) => status < 500,
        maxRedirects: 5,
      });

      if (response.status === 403) {
        lastError = new Error('O SoFIFA está bloqueando requisições. Use ScraperAPI ou VPN.');
        
        if (attempt < maxRetries - 1) {
          await randomDelay(3000, 5000);
        }
        continue;
      }

      if (response.status === 429) {
        lastError = new Error('Muitas requisições. Aguardando antes de tentar novamente...');
        
        if (attempt < maxRetries - 1) {
          await randomDelay(5000, 10000);
        }
        continue;
      }

      if (response.status !== 200) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentativa ${attempt + 1} falhou:`, lastError.message);
      
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
    $('tbody tr').each((_, row) => {
      try {
        const $row = $(row);
        
        const nome = $row.find('td:nth-child(2) a')?.text()?.trim() || '';
        const idade = $row.find('td:nth-child(3)')?.text()?.trim() || '';
        const overall = $row.find('td:nth-child(4)')?.text()?.trim() || '';
        const potencial = $row.find('td:nth-child(5)')?.text()?.trim() || '';
        const time = $row.find('td:nth-child(6) a')?.text()?.trim() || '';
        
        const posicoesText = $row.find('td:nth-child(7)')?.text()?.trim() || '';
        const posicoes = posicoesText
          .split(',')
          .map(p => p.trim())
          .filter(p => p)
          .map(p => translatePosition(p));

        const imagem = $row.find('td:nth-child(2) img')?.attr('data-src') || 
                       $row.find('td:nth-child(2) img')?.attr('src') || 
                       undefined;

        const valorMercado = $row.find('td:nth-child(8)')?.text()?.trim() || undefined;

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
    if (!url || !url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        players: [],
      };
    }

    console.log(`Iniciando scraping de: ${url}`);

    const html = await fetchPageWithRetry(url);

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

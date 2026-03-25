import puppeteer from 'puppeteer';
import { load } from 'cheerio';

// Mapeamento de posicoes do ingles para portugues abreviado conforme padroes brasileiros
const POSITION_TRANSLATIONS: Record<string, string> = {
  'GK': 'GOL',
  'CB': 'ZAG',
  'LB': 'LE',
  'RB': 'LD',
  'LWB': 'ADE',
  'RWB': 'ADD',
  'CM': 'MC',
  'CDM': 'VOL',
  'CAM': 'MEI',
  'LM': 'ME',
  'RM': 'MD',
  'ST': 'ATA',
  'CF': 'SA',
  'LW': 'PE',
  'RW': 'PD',
  'LF': 'SA',
  'RF': 'SA',
};

function translatePosition(position: string): string {
  const upperPos = position.toUpperCase();
  return POSITION_TRANSLATIONS[upperPos] || upperPos;
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

async function fetchPageWithPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Configurar tempo limite e esperar a rede ficar ociosa
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Aguardar a tabela carregar se necessário
    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});
    
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

function extractPlayers(html: string): Player[] {
  const $ = load(html);
  const players: Player[] = [];

  $('tbody tr').each((_, row) => {
    try {
      const $row = $(row);
      const nameCell = $row.find('td').eq(1);
      
      // Nome do jogador
      const nome = nameCell.find('a[href*="/player/"]').first().text().trim();
      
      // Posições - no SoFIFA atual elas ficam dentro de spans com classe .pos na célula do nome (índice 1)
      const posicoes: string[] = [];
      nameCell.find('span.pos').each((_, span) => {
        const posText = $(span).text().trim();
        if (posText) {
          posicoes.push(translatePosition(posText));
        }
      });

      const idade = $row.find('td').eq(2).text().trim();
      const overall = $row.find('td').eq(3).text().trim();
      const potencial = $row.find('td').eq(4).text().trim();
      
      // Time e Contrato (Célula 5)
      const time = $row.find('td').eq(5).find('a[href*="/team/"]').first().text().trim();
      
      // Valor de Mercado (Célula 6)
      const valorMercado = $row.find('td').eq(6).text().trim();

      // Imagem do jogador
      const imagem = nameCell.find('img').attr('data-src') || nameCell.find('img').attr('src');

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
      console.error('Erro ao processar linha:', err);
    }
  });

  return players;
}

export async function scrapeSofifaPlayers(url: string): Promise<ScraperResult> {
  try {
    if (!url || !url.includes('sofifa.com')) {
      return { success: false, error: 'URL inválida.', players: [] };
    }

    console.log(`Iniciando extração via Puppeteer para: ${url}`);
    const html = await fetchPageWithPuppeteer(url);
    const players = extractPlayers(html);

    if (players.length === 0) {
      return { success: false, error: 'Nenhum jogador encontrado. A estrutura do site pode ter mudado.', players: [] };
    }

    return { success: true, error: null, players, count: players.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper:', msg);
    return { success: false, error: `Erro ao acessar página: ${msg}`, players: [] };
  }
}

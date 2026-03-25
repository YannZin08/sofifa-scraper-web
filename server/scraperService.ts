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
  nacionalidade: string;
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
    
    // Aumentar o tempo limite e esperar a rede ficar ociosa
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Aguardar explicitamente a tabela carregar
    await page.waitForSelector('tbody tr', { timeout: 15000 }).catch(() => {});
    
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
      const cells = $row.find('td');
      
      // Coluna 1 (Índice 0): Imagem do Jogador
      const imagem = cells.eq(0).find('img').attr('data-src') || 
                     cells.eq(0).find('img').attr('src');

      // Coluna 2 (Índice 1): Nome, Nacionalidade e Posições
      const nameCell = cells.eq(1);
      
      // Nome do jogador (dentro do link que contém "/player/")
      const nome = nameCell.find('a[href*="/player/"]').first().text().trim();
      
      // Nacionalidade (está no atributo title da imagem da bandeira)
      const nacionalidade = nameCell.find('img.flag').attr('title') || 
                            nameCell.find('img[src*="/flags/"]').attr('title') || 
                            'N/A';
      
      // Posições estão em spans com classe .pos dentro da mesma célula do nome
      const posicoes: string[] = [];
      nameCell.find('span.pos').each((_, span) => {
        const posText = $(span).text().trim();
        if (posText) {
          posicoes.push(translatePosition(posText));
        }
      });

      // Coluna 3 (Índice 2): Idade
      const idade = cells.eq(2).text().trim();

      // Coluna 4 (Índice 3): Overall
      const overall = cells.eq(3).text().trim();

      // Coluna 5 (Índice 4): Potencial
      const potencial = cells.eq(4).text().trim();
      
      // Coluna 6 (Índice 5): Time
      const time = cells.eq(5).find('a[href*="/team/"]').first().text().trim();
      
      // Coluna 7 (Índice 6): Valor de Mercado (Preço)
      const valorMercado = cells.eq(6).text().trim();

      if (nome && overall) {
        players.push({
          nome,
          idade: isNaN(Number(idade)) ? idade : Number(idade),
          overall: isNaN(Number(overall)) ? overall : Number(overall),
          potencial: isNaN(Number(potencial)) ? potencial : Number(potencial),
          time,
          posicoes,
          nacionalidade,
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
      return { success: false, error: 'Nenhum jogador encontrado. Verifique se a URL está correta.', players: [] };
    }

    return { success: true, error: null, players, count: players.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper:', msg);
    return { success: false, error: `Erro ao acessar página: ${msg}`, players: [] };
  }
}

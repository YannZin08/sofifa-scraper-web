import puppeteer, { Browser, Page } from 'puppeteer';
import { load } from 'cheerio';

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

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser) {
    return browser;
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
      ],
    });
    return browser;
  } catch (error) {
    throw new Error(`Falha ao iniciar navegador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

async function scrapePage(url: string): Promise<string> {
  let page: Page | null = null;

  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();

    // Configurar User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Configurar headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // Definir timeout
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    // Navegar para a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Aguardar a tabela carregar
    await page.waitForSelector('tbody', { timeout: 10000 }).catch(() => {
      // Se a tabela não carregar, continua mesmo assim
    });

    // Simular scroll para carregar conteúdo dinâmico
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });

    // Aguardar um pouco para certeza
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Obter o HTML da página
    const html = await page.content();
    return html;
  } catch (error) {
    throw new Error(`Erro ao acessar página: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.error('Erro ao fechar página:', err);
      }
    }
  }
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
      html = await scrapePage(url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
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

        // Posicoes
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

// Limpar recursos ao desligar
process.on('exit', async () => {
  if (browser) {
    try {
      await browser.close();
    } catch (err) {
      console.error('Erro ao fechar navegador:', err);
    }
  }
});

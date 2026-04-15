import axios from 'axios';
import { load } from 'cheerio';
import { Readable } from 'stream';
import path from 'path';
import puppeteer from 'puppeteer';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Mapeamento de posicoes do ingles para portugues abreviado conforme padroes do site
// Prioridade: posições do SoFIFA em português (GOL, ZAG, LD, LE, ADD, ADE, VOL, MC, MEI, MD, ME, PD, PE, ATA, SA)
const POSITION_TRANSLATIONS: Record<string, string> = {
  // Posições em português (já estão corretas)
  'GOL': 'GOL',
  'ZAG': 'ZAG',
  'LD': 'LD',
  'LE': 'LE',
  'ADD': 'ADD',
  'ADE': 'ADE',
  'VOL': 'VOL',
  'MC': 'MC',
  'MEI': 'MEI',  // IMPORTANTE: Meia não deve ser traduzida para PE
  'MD': 'MD',
  'ME': 'ME',
  'PD': 'PD',
  'PE': 'PE',
  'ATA': 'ATA',
  'SA': 'SA',
  
  // Posições em inglês (para compatibilidade)
  'GK': 'GOL',
  'CB': 'ZAG',
  'LB': 'LE',
  'RB': 'LD',
  'LWB': 'ADE',
  'RWB': 'ADD',
  'CM': 'MC',
  'CDM': 'VOL',
  'CAM': 'MEI',  // Camisa 10 / Central Attacking Midfielder → MEI
  'LM': 'ME',
  'RM': 'MD',
  'LCM': 'MC',
  'RCM': 'MC',
  'LDM': 'VOL',
  'RDM': 'VOL',
  'LAM': 'MEI',  // Left Attacking Midfielder → MEI
  'RAM': 'MEI',  // Right Attacking Midfielder → MEI
  'ST': 'ATA',
  'CF': 'ATA',
  'LW': 'PE',
  'RW': 'MD',
  'LF': 'SA',
  'RF': 'SA',
  'AT': 'ATA',
  'EE': 'PE',
  'ED': 'PE',
};

function translatePosition(position: string): string {
  return POSITION_TRANSLATIONS[position] || position;
}

// Mapeamento de países do inglês para português
const COUNTRY_TRANSLATIONS: Record<string, string> = {
  'Afghanistan': 'Afeganistão',
  'Albania': 'Albânia',
  'Algeria': 'Argélia',
  'Andorra': 'Andorra',
  'Angola': 'Angola',
  'Antigua and Barbuda': 'Antígua e Barbuda',
  'Argentina': 'Argentina',
  'Armenia': 'Armênia',
  'Australia': 'Austrália',
  'Austria': 'Áustria',
  'Azerbaijan': 'Azerbaijão',
  'Bahamas': 'Bahamas',
  'Bahrain': 'Bahrein',
  'Bangladesh': 'Bangladesh',
  'Barbados': 'Barbados',
  'Belarus': 'Bielorrússia',
  'Belgium': 'Bélgica',
  'Belize': 'Belize',
  'Benin': 'Benin',
  'Bermuda': 'Bermudas',
  'Bhutan': 'Butão',
  'Bolivia': 'Bolívia',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Botswana': 'Botsuana',
  'Brazil': 'Brasil',
  'Brunei': 'Brunei',
  'Bulgaria': 'Bulgária',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  'Cambodia': 'Camboja',
  'Cameroon': 'Camarões',
  'Canada': 'Canadá',
  'Cape Verde': 'Cabo Verde',
  'Central African Republic': 'República Centro-Africana',
  'Chad': 'Chade',
  'Chile': 'Chile',
  'China': 'China',
  'Colombia': 'Colômbia',
  'Comoros': 'Comores',
  'Congo': 'Congo',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croácia',
  'Cuba': 'Cuba',
  'Cyprus': 'Chipre',
  'Czech Republic': 'República Tcheca',
  'Czechia': 'República Tcheca',
  'Denmark': 'Dinamarca',
  'Djibouti': 'Djibuti',
  'Dominica': 'Dominica',
  'Dominican Republic': 'República Dominicana',
  'Ecuador': 'Equador',
  'Egypt': 'Egito',
  'El Salvador': 'El Salvador',
  'England': 'Inglaterra',
  'Equatorial Guinea': 'Guiné Equatorial',
  'Eritrea': 'Eritreia',
  'Estonia': 'Estônia',
  'Ethiopia': 'Etiópia',
  'Fiji': 'Fiji',
  'Finland': 'Finlândia',
  'France': 'França',
  'Gabon': 'Gabão',
  'Gambia': 'Gâmbia',
  'Georgia': 'Geórgia',
  'Germany': 'Alemanha',
  'Ghana': 'Gana',
  'Greece': 'Grécia',
  'Grenada': 'Granada',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guiné',
  'Guinea-Bissau': 'Guiné-Bissau',
  'Guyana': 'Guiana',
  'Haiti': 'Haiti',
  'Honduras': 'Honduras',
  'Hong Kong': 'Hong Kong',
  'Hungary': 'Hungria',
  'Iceland': 'Islândia',
  'India': 'Índia',
  'Indonesia': 'Indonésia',
  'Iran': 'Irã',
  'Iraq': 'Iraque',
  'Ireland': 'Irlanda',
  'Israel': 'Israel',
  'Italy': 'Itália',
  'Ivory Coast': 'Costa do Marfim',
  'Jamaica': 'Jamaica',
  'Japan': 'Japão',
  'Jordan': 'Jordânia',
  'Kazakhstan': 'Cazaquistão',
  'Kenya': 'Quênia',
  'Korea': 'Coreia',
  'North Korea': 'Coreia do Norte',
  'South Korea': 'Coreia do Sul',
  'Kosovo': 'Kosovo',
  'Kuwait': 'Kuwait',
  'Kyrgyzstan': 'Quirguistão',
  'Laos': 'Laos',
  'Latvia': 'Letônia',
  'Lebanon': 'Líbano',
  'Lesotho': 'Lesoto',
  'Liberia': 'Libéria',
  'Libya': 'Líbia',
  'Liechtenstein': 'Liechtenstein',
  'Lithuania': 'Lituânia',
  'Luxembourg': 'Luxemburgo',
  'Macao': 'Macau',
  'Madagascar': 'Madagáscar',
  'Malawi': 'Malawi',
  'Malaysia': 'Malásia',
  'Maldives': 'Maldivas',
  'Mali': 'Mali',
  'Malta': 'Malta',
  'Mauritania': 'Mauritânia',
  'Mauritius': 'Maurício',
  'Mexico': 'México',
  'Moldova': 'Moldávia',
  'Monaco': 'Mônaco',
  'Mongolia': 'Mongólia',
  'Montenegro': 'Montenegro',
  'Morocco': 'Marrocos',
  'Mozambique': 'Moçambique',
  'Myanmar': 'Mianmar',
  'Namibia': 'Namíbia',
  'Nepal': 'Nepal',
  'Netherlands': 'Países Baixos',
  'New Zealand': 'Nova Zelândia',
  'Nicaragua': 'Nicarágua',
  'Niger': 'Níger',
  'Nigeria': 'Nigéria',
  'Northern Ireland': 'Irlanda do Norte',
  'Norway': 'Noruega',
  'Oman': 'Omã',
  'Pakistan': 'Paquistão',
  'Palestine': 'Palestina',
  'Panama': 'Panamá',
  'Papua New Guinea': 'Papua-Nova Guiné',
  'Paraguay': 'Paraguai',
  'Peru': 'Peru',
  'Philippines': 'Filipinas',
  'Poland': 'Polônia',
  'Portugal': 'Portugal',
  'Qatar': 'Catar',
  'Romania': 'Romênia',
  'Russia': 'Rússia',
  'Rwanda': 'Ruanda',
  'Saint Kitts and Nevis': 'São Cristóvão e Névis',
  'Saint Lucia': 'Santa Lúcia',
  'Saint Vincent and the Grenadines': 'São Vicente e Granadinas',
  'Samoa': 'Samoa',
  'San Marino': 'San Marino',
  'Sao Tome and Principe': 'São Tomé e Príncipe',
  'Saudi Arabia': 'Arábia Saudita',
  'Scotland': 'Escócia',
  'Senegal': 'Senegal',
  'Serbia': 'Sérvia',
  'Seychelles': 'Seicheles',
  'Sierra Leone': 'Serra Leoa',
  'Singapore': 'Singapura',
  'Slovakia': 'Eslováquia',
  'Slovenia': 'Eslovênia',
  'Solomon Islands': 'Ilhas Salomão',
  'Somalia': 'Somália',
  'South Africa': 'África do Sul',
  'South Sudan': 'Sudão do Sul',
  'Spain': 'Espanha',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Sudão',
  'Suriname': 'Suriname',
  'Sweden': 'Suécia',
  'Switzerland': 'Suíça',
  'Syria': 'Síria',
  'Taiwan': 'Taiwan',
  'Tajikistan': 'Tajiquistão',
  'Tanzania': 'Tanzânia',
  'Thailand': 'Tailândia',
  'Timor-Leste': 'Timor-Leste',
  'Togo': 'Togo',
  'Tonga': 'Tonga',
  'Trinidad and Tobago': 'Trinidad e Tobago',
  'Tunisia': 'Tunísia',
  'Turkey': 'Turquia',
  'Turkmenistan': 'Turcomenistão',
  'Uganda': 'Uganda',
  'Ukraine': 'Ucrânia',
  'United Arab Emirates': 'Emirados Árabes Unidos',
  'United Kingdom': 'Reino Unido',
  'United States': 'Estados Unidos',
  'Uruguay': 'Uruguai',
  'Uzbekistan': 'Uzbequistão',
  'Vanuatu': 'Vanuatu',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnã',
  'Wales': 'País de Gales',
  'Yemen': 'Iêmen',
  'Zambia': 'Zâmbia',
  'Zimbabwe': 'Zimbábue',
};

function translateCountry(country: string): string {
  return COUNTRY_TRANSLATIONS[country] || country;
}

interface Player {
  nome: string;
  idade: number | string;
  overall: number | string;
  potencial: number | string;
  time: string;
  posicoes: string[];
  pais?: string;
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


async function fetchPageWithPuppeteer(url: string): Promise<string> {
  let browser;
  try {
    console.log('[Puppeteer] Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    console.log('[Puppeteer] Criando página...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Definir headers realistas
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navegar para a página
    console.log('[Puppeteer] Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('[Puppeteer] Página carregada, aguardando 2s...');
    // Aguardar um pouco para garantir que o conteúdo foi carregado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obter o HTML renderizado
    console.log('[Puppeteer] Obtendo HTML...');
    const html = await page.content();
    
    console.log('[Puppeteer] Fechando navegador...');
    await browser.close();
    console.log('[Puppeteer] Sucesso!');
    return html;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Puppeteer] Erro:', errorMessage);
    throw error;
  }
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


// Lista de proxies gratuitos públicos
const FREE_PROXIES = [
  'http://proxy.example.com:8080',
  'http://proxy2.example.com:3128',
  // Nota: Proxies reais seriam obtidos de um serviço como free-proxy-list.net
];

function getRandomProxy(): string | null {
  // Por enquanto, retornar null (sem proxy)
  // Em produção, isso buscaria proxies reais de um serviço
  return null;
}

async function fetchPageWithRetry(url: string, maxRetries: number = 5): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.random() * 3000 + 2000; // 2-5 segundos
        console.log(`Tentativa ${attempt + 1}/${maxRetries} após ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      ];

      const headers = {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      const response = await axios.get(url, {
        headers,
        timeout: 30000,
        validateStatus: () => true, // Aceitar qualquer status
        maxRedirects: 5,
      });

      // Tentar extrair dados mesmo com 403 ou outros erros
      if (response.data && response.data.length > 0) {
        console.log(`Sucesso! Status ${response.status}, dados obtidos (${response.data.length} bytes)`);
        return response.data;
      }

      if (response.status === 200) {
        return response.data;
      }

      console.log(`HTTP ${response.status} na tentativa ${attempt + 1}, tentando novamente...`);
      lastError = new Error(`HTTP ${response.status}`)
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentativa ${attempt + 1} falhou:`, lastError.message);
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
        const $cells = $row.find('td');
        
        // TD[1] - Nome (via link) e Posições (via spans)
        const $td1 = $cells.eq(1);
        const nome = $td1.find('a[href*="/player/"]').first().text().trim() || '';
        
        // Extrair posições dos spans dentro de TD[1]
        const posicoes: string[] = [];
        $td1.find('span').each((_, span) => {
          const posText = $(span).text().trim();
          // Filtrar apenas posições válidas (2-4 caracteres)
          if (posText && posText.length >= 2 && posText.length <= 4 && /^[A-Z]+$/.test(posText)) {
            posicoes.push(translatePosition(posText));
          }
        });
        
        // TD[2] - Idade
        const idade = $cells.eq(2).text().trim() || '';
        
        // TD[3] - Overall
        const overall = $cells.eq(3).text().trim() || '';
        
        // TD[4] - Potencial
        const potencial = $cells.eq(4).text().trim() || '';
        
        // TD[5] - Time (primeiro link)
        const time = $cells.eq(5).find('a').first().text().trim() || '';
        
        // TD[16] - Valor de Mercado (com unidade M/K)
        // Se a tabela tem poucas colunas (renderização normal), tenta TD[6]
        // Se tem muitas colunas (ScraperAPI), usa TD[16]
        let valorMercado: string | undefined = $cells.eq(16).text().trim();
        if (!valorMercado && $cells.length < 20) {
          valorMercado = $cells.eq(6).text().trim();
        }
        valorMercado = valorMercado || undefined;

        // País do jogador (via flag em TD[1])
        const flagImg = $td1.find('img.flag');
        const paisIngles = flagImg.attr('title') || '';
        const pais = paisIngles ? translateCountry(paisIngles) : undefined;

        // Imagem do jogador (em TD[0] com classe player-check)
        const playerImg = $cells.eq(0).find('img.player-check');
        const imagem = playerImg.attr('data-src') || 
                       playerImg.attr('src') || 
                       undefined;

        if (nome && overall) {
          players.push({
            nome,
            idade: isNaN(Number(idade)) ? idade : Number(idade),
            overall: isNaN(Number(overall)) ? overall : Number(overall),
            potencial: isNaN(Number(potencial)) ? potencial : Number(potencial),
            time,
            posicoes,
            pais,
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

export async function scrapeSofifaPlayersBatch(baseUrl: string, startOffset: number, endOffset: number, step: number = 60): Promise<ScraperResult> {
  try {
    if (!baseUrl || !baseUrl.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        players: [],
      };
    }

    // Validar intervalo
    if (startOffset < 0 || endOffset < startOffset) {
      return {
        success: false,
        error: 'Intervalo inválido. O offset final deve ser maior ou igual ao inicial.',
        players: [],
      };
    }

    // Calcular número de páginas (cada página tem ~60 jogadores)
    const numPages = Math.ceil((endOffset - startOffset + 1) / step);
    if (numPages > 10) {
      return {
        success: false,
        error: `Intervalo muito grande. Máximo de 10 páginas (600 offsets). Você pediu ${numPages} páginas.`,
        players: [],
      };
    }

    const allPlayers: Player[] = [];
    const offsets = [];

    // Gerar lista de offsets - garantir que não ultrapasse endOffset
    for (let offset = startOffset; offset <= endOffset; offset += step) {
      offsets.push(offset);
    }

    console.log(`Iniciando scraping em lote: ${offsets.length} páginas, offsets: ${startOffset} a ${endOffset}`);

    // Extrair cada página
    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i];
      
      try {
        // Construir URL com novo offset
        const separator = baseUrl.includes('?') ? '&' : '?';
        const urlWithoutOffset = baseUrl.replace(/[?&]offset=\d+/, '');
        const pageUrl = `${urlWithoutOffset}${separator}offset=${offset}`;

        console.log(`[${i + 1}/${offsets.length}] Extraindo página com offset ${offset}...`);

        const html = await fetchPageWithRetry(pageUrl);
        const players = extractPlayers(html);

        if (players.length > 0) {
          allPlayers.push(...players);
          console.log(`  ✓ ${players.length} jogadores encontrados`);
        } else {
          console.log(`  ⚠ Nenhum jogador encontrado nesta página`);
        }

        // Delay entre requisições para não sobrecarregar
        if (i < offsets.length - 1) {
          await randomDelay(1000, 3000);
        }
      } catch (pageError) {
        const errorMessage = pageError instanceof Error ? pageError.message : 'Erro desconhecido';
        console.error(`Erro ao extrair página com offset ${offset}:`, errorMessage);
        // Continuar com próxima página em caso de erro
      }
    }

    if (allPlayers.length === 0) {
      return {
        success: false,
        error: 'Nenhum jogador encontrado em nenhuma das páginas. Verifique o intervalo de offsets.',
        players: [],
      };
    }

    return {
      success: true,
      error: null,
      players: allPlayers,
      count: allPlayers.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper em lote:', errorMessage);

    return {
      success: false,
      error: `Erro ao extrair em lote: ${errorMessage}`,
      players: [],
    };
  }
}

// Função para fazer download de imagens dos jogadores em ZIP
export async function downloadPlayerImages(players: Player[]): Promise<Buffer> {
  try {
    // Usar JSZip que é mais simples e não requer dependências externas
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Criar pasta para imagens
    const imagesFolder = zip.folder('imagens_jogadores');
    
    if (!imagesFolder) {
      throw new Error('Erro ao criar pasta no ZIP');
    }
    
    // Download de cada imagem
    for (const player of players) {
      if (player.imagem) {
        try {
          // Sanitizar nome do jogador para usar como nome de arquivo
          const sanitizedName = player.nome
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .toLowerCase();
          
          // Fazer download da imagem
          const response = await axios.get(player.imagem, {
            responseType: 'arraybuffer',
            timeout: 10000,
          });
          
          // Adicionar imagem ao ZIP com nome do jogador
          const ext = player.imagem.includes('.png') ? 'png' : 'jpg';
          imagesFolder.file(`${sanitizedName}.${ext}`, response.data);
          
          console.log(`✓ Imagem de ${player.nome} adicionada ao ZIP`);
        } catch (imgError) {
          const errorMessage = imgError instanceof Error ? imgError.message : 'Erro desconhecido';
          console.warn(`⚠ Erro ao baixar imagem de ${player.nome}: ${errorMessage}`);
          // Continuar com próximo jogador em caso de erro
        }
      }
    }
    
    // Gerar buffer do ZIP
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    if (!buffer) {
      throw new Error('Erro ao gerar arquivo ZIP');
    }
    
    return buffer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao criar ZIP de imagens:', errorMessage);
    throw error;
  }
}


// Interface para times
interface Team {
  nome: string;
  liga: string;
  orcamento: string;
  valorClube: string;
  nacionalidade: string;
  logo?: string;
  bandeira?: string;
}

interface TeamResult {
  success: boolean;
  error: string | null;
  teams: Team[];
  count?: number;
}

interface TeamDetails {
  nome: string;
  liga: string;
  estadio: string;
  rivalTime: string;
  prestigioInternacional: string | number;
  prestigioLocal: string | number;
}

interface TeamDetailsResult {
  success: boolean;
  error: string | null;
  details: TeamDetails[];
  count?: number;
}

// Função para extrair times
export async function scrapeSofifaTeams(url: string): Promise<TeamResult> {
  try {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'URL inválida',
        teams: [],
      };
    }

    if (!url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'A URL deve ser do site sofifa.com',
        teams: [],
      };
    }

    console.log('Extraindo times de:', url);

    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      return {
        success: false,
        error: 'SCRAPER_API_KEY não configurada',
        teams: [],
      };
    }

    console.log('Usando ScraperAPI para contornar bloqueios...');
    const response = await axios.get(
      `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=false`,
      { timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity }
    );

    const $ = load(response.data);
    const teams: Team[] = [];

    // Extrair times da tabela
    const rows = $('table tbody tr');
    console.log(`Encontrados ${rows.length} times`);

    rows.each((index, row) => {
      try {
        const $row = $(row);
        const cells = $row.find('td');

        if (cells.length < 8) return;

        // TD[1]: Nome do time + Liga
        const cell1 = cells.eq(1);
        
        // Extrair nome do primeiro link
        const nomeLink = cell1.find('a').first().text().trim();
        const nome = nomeLink || 'Desconhecido';
        
        // Extrair liga do segundo link
        const ligaLink = cell1.find('a').last().text().trim();
        const liga = ligaLink || 'Desconhecida';

        // TD[6]: Orçamento
        const orcamento = cells.eq(6).text().trim() || '-';

        // TD[7]: Valor do clube
        const valorClube = cells.eq(7).text().trim() || '-';

        // Imagens
        const images = $row.find('img');
        let logo = '';
        let bandeira = '';

        images.each((i, img) => {
          const $img = $(img);
          const dataSrc = $img.attr('data-src') || '';
          
          if (i === 0 && dataSrc.includes('/team/')) {
            logo = dataSrc;
          } else if (i === 1 && dataSrc.includes('/flags/')) {
            bandeira = dataSrc;
          }
        });

        // Extrair nacionalidade da bandeira URL
        let nacionalidade = '-';
        if (bandeira) {
          const countryCode = bandeira.split('/').pop()?.replace('.png', '').toUpperCase() || '';
          nacionalidade = translateCountryCode(countryCode);
        }

        teams.push({
          nome: nome || 'Desconhecido',
          liga: liga || 'Desconhecida',
          orcamento,
          valorClube,
          nacionalidade,
          logo,
          bandeira,
        });
      } catch (error) {
        console.error('Erro ao processar linha:', error);
      }
    });

    if (teams.length === 0) {
      return {
        success: false,
        error: 'Nenhum time encontrado. Verifique a URL ou tente novamente.',
        teams: [],
      };
    }

    return {
      success: true,
      error: null,
      teams,
      count: teams.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao extrair times:', errorMessage);
    
    // Se for erro de conexão incompleta, tentar novamente sem ScraperAPI
    if (errorMessage.includes('IncompleteRead') || errorMessage.includes('ECONNRESET')) {
      console.log('Tentando novamente com configuração alternativa...');
      try {
        const retryResponse = await axios.get(url, {
          timeout: 30000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $ = load(retryResponse.data);
        const teams: Team[] = [];
        const rows = $('table tbody tr');
        
        rows.each((index, row) => {
          try {
            const $row = $(row);
            const cells = $row.find('td');
            if (cells.length < 8) return;
            
            const cell1 = cells.eq(1);
            const nomeLink = cell1.find('a').first().text().trim();
            const nome = nomeLink || 'Desconhecido';
            const ligaLink = cell1.find('a').last().text().trim();
            const liga = ligaLink || 'Desconhecida';
            const orcamento = cells.eq(6).text().trim() || '-';
            const valorClube = cells.eq(7).text().trim() || '-';
            
            const images = $row.find('img');
            let logo = '';
            let bandeira = '';
            
            images.each((i, img) => {
              const $img = $(img);
              const dataSrc = $img.attr('data-src') || '';
              if (i === 0 && dataSrc.includes('/team/')) {
                logo = dataSrc;
              } else if (i === 1 && dataSrc.includes('/flags/')) {
                bandeira = dataSrc;
              }
            });
            
            let nacionalidade = '-';
            if (bandeira) {
              const countryCode = bandeira.split('/').pop()?.replace('.png', '').toUpperCase() || '';
              nacionalidade = translateCountryCode(countryCode);
            }
            
            teams.push({
              nome: nome || 'Desconhecido',
              liga: liga || 'Desconhecida',
              orcamento,
              valorClube,
              nacionalidade,
              logo,
              bandeira,
            });
          } catch (err) {
            console.error('Erro ao processar linha (retry):', err);
          }
        });
        
        if (teams.length > 0) {
          return {
            success: true,
            error: null,
            teams,
            count: teams.length,
          };
        }
      } catch (retryError) {
        console.error('Erro na tentativa alternativa:', retryError);
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      teams: [],
    };
  }
}

// Função para traduzir código de país para português
function translateCountryCode(code: string): string {
  const countryMap: Record<string, string> = {
    'DE': 'Alemanha',
    'ES': 'Espanha',
    'FR': 'França',
    'IT': 'Itália',
    'PT': 'Portugal',
    'BR': 'Brasil',
    'AR': 'Argentina',
    'GB': 'Inglaterra',
    'NL': 'Holanda',
    'BE': 'Bélgica',
    'AT': 'Áustria',
    'CH': 'Suíça',
    'SE': 'Suécia',
    'NO': 'Noruega',
    'DK': 'Dinamarca',
    'PL': 'Polônia',
    'CZ': 'República Tcheca',
    'RO': 'Romênia',
    'GR': 'Grécia',
    'TR': 'Turquia',
    'RU': 'Rússia',
    'UA': 'Ucrânia',
    'JP': 'Japão',
    'CN': 'China',
    'IN': 'Índia',
    'MX': 'México',
    'US': 'Estados Unidos',
    'CA': 'Canadá',
    'AU': 'Austrália',
    'ZA': 'África do Sul',
    'EG': 'Egito',
    'NG': 'Nigéria',
    'KR': 'Coreia do Sul',
    'TH': 'Tailândia',
    'SG': 'Singapura',
    'MY': 'Malásia',
    'ID': 'Indonésia',
    'PH': 'Filipinas',
    'VN': 'Vietnã',
    'CL': 'Chile',
    'CO': 'Colômbia',
    'PE': 'Peru',
    'UY': 'Uruguai',
    'PY': 'Paraguai',
    'BO': 'Bolívia',
    'EC': 'Equador',
    'VE': 'Venezuela',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'GT': 'Guatemala',
    'NI': 'Nicarágua',
    'BZ': 'Belize',
    'DO': 'República Dominicana',
    'PR': 'Porto Rico',
    'TT': 'Trinidad e Tobago',
    'BB': 'Barbados',
    'BS': 'Bahamas',
    'BH': 'Bahrein',
    'QA': 'Catar',
    'AE': 'Emirados Árabes Unidos',
    'SA': 'Arábia Saudita',
    'KW': 'Kuwait',
    'OM': 'Omã',
    'YE': 'Iêmen',
    'IL': 'Israel',
    'JO': 'Jordânia',
    'LB': 'Líbano',
    'SY': 'Síria',
    'IQ': 'Iraque',
    'IR': 'Irã',
    'AF': 'Afeganistão',
    'PK': 'Paquistão',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'BT': 'Butão',
    'MM': 'Mianmar',
    'KH': 'Camboja',
    'LA': 'Laos',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'MO': 'Macau',
    'NZ': 'Nova Zelândia',
    'FJ': 'Fiji',
    'PG': 'Papua Nova Guiné',
    'SB': 'Ilhas Salomão',
    'VU': 'Vanuatu',
    'WS': 'Samoa',
    'TO': 'Tonga',
    'KI': 'Quiribáti',
    'MH': 'Ilhas Marshall',
    'FM': 'Micronésia',
    'PW': 'Palau',
    'GU': 'Guam',
    'AS': 'Samoa Americana',
    'MP': 'Ilhas Marianas do Norte',
    'VI': 'Ilhas Virgens Americanas',
    'GS': 'Geórgia do Sul e Ilhas Sandwich do Sul',
    'FK': 'Ilhas Malvinas',
    'GI': 'Gibraltar',
    'MT': 'Malta',
    'CY': 'Chipre',
    'IS': 'Islândia',
    'IE': 'Irlanda',
    'LU': 'Luxemburgo',
    'HR': 'Croácia',
    'SI': 'Eslovênia',
    'SK': 'Eslováquia',
    'HU': 'Hungria',
    'RS': 'Sérvia',
    'BG': 'Bulgária',
    'BA': 'Bósnia e Herzegovina',
    'ME': 'Montenegro',
    'MK': 'Macedônia do Norte',
    'AL': 'Albânia',
    'XK': 'Kosovo',
    'BY': 'Bielorrússia',
    'MD': 'Moldávia',
    'GE': 'Geórgia',
    'AM': 'Armênia',
    'AZ': 'Azerbaijão',
    'KZ': 'Cazaquistão',
    'UZ': 'Uzbequistão',
    'TM': 'Turcomenistão',
    'KG': 'Quirguistão',
    'TJ': 'Tajiquistão',
    'MN': 'Mongólia',
    'KP': 'Coreia do Norte',
    'TL': 'Timor-Leste',
    'BN': 'Brunei',
    'MV': 'Maldivas',
    'ET': 'Etiópia',
    'KE': 'Quênia',
    'TZ': 'Tanzânia',
    'UG': 'Uganda',
    'RW': 'Ruanda',
    'BJ': 'Benin',
    'BF': 'Burkina Faso',
    'CI': 'Costa do Marfim',
    'CM': 'Camarões',
    'CF': 'República Centro-Africana',
    'TD': 'Chade',
    'CG': 'Congo',
    'CD': 'República Democrática do Congo',
    'GA': 'Gabão',
    'GQ': 'Guiné Equatorial',
    'ST': 'São Tomé e Príncipe',
    'SC': 'Seicheles',
    'MU': 'Maurício',
    'MG': 'Madagascar',
    'MW': 'Malaui',
    'MZ': 'Moçambique',
    'ZM': 'Zâmbia',
    'ZW': 'Zimbábue',
    'BW': 'Botsuana',
    'NA': 'Namíbia',
    'LS': 'Lesoto',
    'SZ': 'Eswatini',
    'DZ': 'Argélia',
    'MA': 'Marrocos',
    'TN': 'Tunísia',
    'LY': 'Líbia',
    'SD': 'Sudão',
    'SS': 'Sudão do Sul',
    'SO': 'Somália',
    'DJ': 'Djibuti',
    'ER': 'Eritreia',
    'GH': 'Gana',
    'GM': 'Gâmbia',
    'GN': 'Guiné',
    'GW': 'Guiné-Bissau',
    'LR': 'Libéria',
    'ML': 'Mali',
    'MR': 'Mauritânia',
    'NE': 'Níger',
    'SN': 'Senegal',
    'SL': 'Serra Leoa',
    'TG': 'Togo',
  };

  return countryMap[code] || code;
}

// Função para fazer download de imagens de times em ZIP
export async function downloadTeamImages(teams: Team[]): Promise<Buffer> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const imagesFolder = zip.folder('imagens_times');

    if (!imagesFolder) {
      throw new Error('Erro ao criar pasta no ZIP');
    }

    for (const team of teams) {
      try {
        // Download do logo
        if (team.logo) {
          try {
            const logoResponse = await axios.get(team.logo, { responseType: 'arraybuffer' });
            const logoFileName = `${sanitizeFileName(team.nome)}_logo.png`;
            imagesFolder.file(logoFileName, logoResponse.data);
          } catch (error) {
            console.warn(`Erro ao baixar logo de ${team.nome}:`, error);
          }
        }

        // Download da bandeira
        if (team.bandeira) {
          try {
            const bandeiraResponse = await axios.get(team.bandeira, { responseType: 'arraybuffer' });
            const bandeiraFileName = `${sanitizeFileName(team.nome)}_bandeira.png`;
            imagesFolder.file(bandeiraFileName, bandeiraResponse.data);
          } catch (error) {
            console.warn(`Erro ao baixar bandeira de ${team.nome}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Erro ao processar imagens do time ${team.nome}:`, error);
      }
    }

    // Gerar buffer do ZIP
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    if (!buffer) {
      throw new Error('Erro ao gerar arquivo ZIP');
    }

    return buffer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao criar ZIP de imagens de times:', errorMessage);
    throw error;
  }
}

// Função auxiliar para sanitizar nomes de arquivo
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

// Função para extrair detalhes de um time individual
async function extractTeamDetailsFromPage(teamUrl: string): Promise<TeamDetails | null> {
  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      throw new Error('SCRAPER_API_KEY não configurada');
    }

    const response = await axios.get(
      `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(teamUrl)}`,
      { timeout: 60000 }
    );

    const $ = load(response.data);
    
    // Extrair informações da página do time
    const details: Partial<TeamDetails> = {};

    // Procurar por labels e seus valores correspondentes
    const listItems = $('ul.nowrap li');
    
    listItems.each((_, item) => {
      const $item = $(item);
      const label = $item.find('label').text().trim().toLowerCase();
      const value = $item.text().replace($item.find('label').text(), '').trim();

      if (label.includes('stadium')) {
        details.estadio = value || '-';
      } else if (label.includes('rival')) {
        // Extrair nome do time rival do link
        const rivalLink = $item.find('a');
        details.rivalTime = rivalLink.text().trim() || value || '-';
      } else if (label.includes('international prestige')) {
        details.prestigioInternacional = value || '-';
      } else if (label.includes('domestic prestige')) {
        details.prestigioLocal = value || '-';
      }
    });

    // Se não encontrou informações suficientes, retorna null
    if (!details.estadio && !details.rivalTime) {
      return null;
    }

    return {
      nome: '',
      liga: '',
      estadio: details.estadio || '-',
      rivalTime: details.rivalTime || '-',
      prestigioInternacional: details.prestigioInternacional || '-',
      prestigioLocal: details.prestigioLocal || '-',
    };
  } catch (error) {
    console.error('Erro ao extrair detalhes do time:', error);
    return null;
  }
}

// Função para extrair detalhes de múltiplos times
export async function scrapeSofifaTeamDetails(url: string): Promise<TeamDetailsResult> {
  try {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'URL inválida',
        details: [],
      };
    }

    if (!url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'A URL deve ser do site sofifa.com',
        details: [],
      };
    }

    console.log('Extraindo detalhes de times de:', url);

    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      return {
        success: false,
        error: 'SCRAPER_API_KEY não configurada',
        details: [],
      };
    }

    // Primeiro, extrair a lista de times
    const response = await axios.get(
      `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`,
      { timeout: 60000 }
    );

    const $ = load(response.data);
    const teamLinks: Array<{ nome: string; liga: string; url: string }> = [];

    // Extrair links dos times
    const rows = $('table tbody tr');
    rows.each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 2) return;

      const cell1 = cells.eq(1);
      const nomeLink = cell1.find('a').first();
      const nome = nomeLink.text().trim();
      const href = nomeLink.attr('href');

      const ligaLink = cell1.find('a').last();
      const liga = ligaLink.text().trim();

      if (nome && href) {
        teamLinks.push({
          nome,
          liga,
          url: `https://sofifa.com${href}`,
        });
      }
    });

    if (teamLinks.length === 0) {
      return {
        success: false,
        error: 'Nenhum time encontrado. Verifique a URL ou tente novamente.',
        details: [],
      };
    }

    // Extrair detalhes de cada time
    const details: TeamDetails[] = [];
    for (const team of teamLinks) {
      try {
        const teamDetails = await extractTeamDetailsFromPage(team.url);
        if (teamDetails) {
          details.push({
            ...teamDetails,
            nome: team.nome,
            liga: team.liga,
          });
        }
      } catch (error) {
        console.error(`Erro ao extrair detalhes de ${team.nome}:`, error);
      }
    }

    if (details.length === 0) {
      return {
        success: false,
        error: 'Não foi possível extrair detalhes dos times.',
        details: [],
      };
    }

    return {
      success: true,
      error: null,
      details,
      count: details.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao extrair detalhes de times:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      details: [],
    };
  }
}


// Função para extrair detalhes de times em lote com offsets
export async function scrapeSofifaTeamDetailsBatch(
  baseUrl: string,
  startOffset: number,
  endOffset: number,
  step: number = 60
): Promise<TeamDetailsResult> {
  try {
    if (!baseUrl || typeof baseUrl !== 'string') {
      return {
        success: false,
        error: 'URL inválida',
        details: [],
      };
    }

    if (!baseUrl.includes('sofifa.com')) {
      return {
        success: false,
        error: 'A URL deve ser do site sofifa.com',
        details: [],
      };
    }

    if (startOffset < 0 || endOffset < startOffset) {
      return {
        success: false,
        error: 'Intervalo inválido',
        details: [],
      };
    }

    if (endOffset - startOffset > 600) {
      return {
        success: false,
        error: 'Intervalo muito grande. Máximo de 600 offsets por vez',
        details: [],
      };
    }

    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      return {
        success: false,
        error: 'SCRAPER_API_KEY não configurada',
        details: [],
      };
    }

    const numPages = Math.ceil((endOffset - startOffset) / step) + 1;
    console.log(`Iniciando scraping em lote de detalhes: ${numPages} páginas, offsets: ${startOffset} a ${endOffset}`);

    const allDetails: TeamDetails[] = [];

    for (let offset = startOffset; offset <= endOffset; offset += step) {
      try {
        const pageNum = Math.floor((offset - startOffset) / step) + 1;
        console.log(`[${pageNum}/${numPages}] Extraindo detalhes com offset ${offset}...`);

        // Construir URL com offset
        const separator = baseUrl.includes('?') ? '&' : '?';
        const urlWithOffset = `${baseUrl}${separator}offset=${offset}`;

        // Extrair lista de times da página
        const response = await axios.get(
          `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(urlWithOffset)}`,
          { timeout: 60000 }
        );

        const $ = load(response.data);
        const teamLinks: Array<{ nome: string; liga: string; url: string }> = [];

        // Extrair links dos times
        const rows = $('table tbody tr');
        rows.each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td');

          if (cells.length < 2) return;

          const cell1 = cells.eq(1);
          const nomeLink = cell1.find('a').first();
          const nome = nomeLink.text().trim();
          const href = nomeLink.attr('href');

          const ligaLink = cell1.find('a').last();
          const liga = ligaLink.text().trim();

          if (nome && href) {
            teamLinks.push({
              nome,
              liga,
              url: `https://sofifa.com${href}`,
            });
          }
        });

        // Extrair detalhes de cada time
        for (const team of teamLinks) {
          try {
            const teamDetails = await extractTeamDetailsFromPage(team.url);
            if (teamDetails) {
              allDetails.push({
                ...teamDetails,
                nome: team.nome,
                liga: team.liga,
              });
            }
          } catch (error) {
            console.error(`Erro ao extrair detalhes de ${team.nome}:`, error);
          }
        }

        console.log(`✓ ${teamLinks.length} times processados nesta página`);
      } catch (error) {
        console.error(`Erro ao processar página com offset ${offset}:`, error);
      }
    }

    if (allDetails.length === 0) {
      return {
        success: false,
        error: 'Não foi possível extrair detalhes dos times.',
        details: [],
      };
    }

    return {
      success: true,
      error: null,
      details: allDetails,
      count: allDetails.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao extrair detalhes de times em lote:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      details: [],
    };
  }
}

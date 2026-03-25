import axios from 'axios';
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

export async function scrapeSofifaPlayers(url: string): Promise<ScraperResult> {
  try {
    // Fazer requisição com User-Agent para evitar bloqueios
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    if (response.status !== 200) {
      return {
        success: false,
        error: `HTTP ${response.status}: Falha ao acessar a URL`,
        players: []
      };
    }

    const $ = load(response.data);
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
        error: 'Nenhum jogador encontrado na página.',
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

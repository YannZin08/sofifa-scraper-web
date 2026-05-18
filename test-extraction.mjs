import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const baseUrl = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('Iniciando teste de extração em lote...');
console.log('URL:', baseUrl);
console.log('Intervalo: 0-1200 (todas as 15 páginas)');
console.log('---');

try {
  const result = await scrapeSofifaPlayersBatch(baseUrl, 0, 1200, 60);
  
  console.log('\nResultado:');
  console.log('Sucesso:', result.success);
  console.log('Total de jogadores:', result.count);
  console.log('Erro:', result.error);
  
  if (result.players && result.players.length > 0) {
    console.log('\nPrimeiros 3 jogadores:');
    result.players.slice(0, 3).forEach((player, idx) => {
      console.log(`${idx + 1}. ${player.name} - ${player.positions} (Overall: ${player.overall})`);
    });
  }
} catch (error) {
  console.error('Erro durante teste:', error);
}

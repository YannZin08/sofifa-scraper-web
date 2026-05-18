import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const baseUrl = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('Testando extração completa...');

try {
  const result = await scrapeSofifaPlayersBatch(baseUrl, 0, 60, 60);
  
  if (result.success && result.players.length > 0) {
    console.log('\n✓ Extração bem-sucedida!');
    console.log('Total de jogadores:', result.count);
    console.log('\nPrimeiros 5 jogadores:');
    result.players.slice(0, 5).forEach((player, idx) => {
      console.log(`${idx + 1}. ${player.nome} - ${player.posicoes.join('/')} (Overall: ${player.overall}, Time: ${player.time})`);
    });
  } else {
    console.log('Erro:', result.error);
  }
} catch (error) {
  console.error('Erro:', error.message);
}

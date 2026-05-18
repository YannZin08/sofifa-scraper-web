import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const baseUrl = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('Testando extração com ScraperAPI...');
console.log('URL:', baseUrl);
console.log('Extraindo primeira página (offset 0-60)...');
console.log('---');

try {
  const result = await scrapeSofifaPlayersBatch(baseUrl, 0, 60, 60);
  
  console.log('\nResultado:');
  console.log('Sucesso:', result.success);
  console.log('Total de jogadores:', result.count);
  
  if (result.error) {
    console.log('Erro:', result.error);
  }
  
  if (result.players && result.players.length > 0) {
    console.log('\nPrimeiros 3 jogadores:');
    result.players.slice(0, 3).forEach((player, idx) => {
      console.log(`${idx + 1}. ${player.name} - ${player.positions} (Overall: ${player.overall})`);
    });
    console.log('\n✓ ScraperAPI está funcionando!');
  } else {
    console.log('\n✗ Nenhum jogador extraído');
  }
} catch (error) {
  console.error('Erro durante teste:', error.message);
}

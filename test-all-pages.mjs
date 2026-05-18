import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const baseUrl = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('Testando extração de TODAS as 15 páginas (0-1200 offsets)...');
console.log('Isso pode levar alguns minutos...\n');

const startTime = Date.now();

try {
  const result = await scrapeSofifaPlayersBatch(baseUrl, 0, 1200, 60);
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  if (result.success) {
    console.log('\n✓✓✓ SUCESSO! ✓✓✓');
    console.log(`Total de jogadores extraídos: ${result.count}`);
    console.log(`Tempo total: ${duration} minutos`);
    console.log(`Média: ${(result.count / duration).toFixed(0)} jogadores/minuto`);
    
    console.log('\nÚltimos 5 jogadores:');
    result.players.slice(-5).forEach((player, idx) => {
      console.log(`${result.count - 4 + idx}. ${player.nome} - ${player.posicoes.join('/')} (Overall: ${player.overall})`);
    });
  } else {
    console.log('Erro:', result.error);
  }
} catch (error) {
  console.error('Erro:', error.message);
}

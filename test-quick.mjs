import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';
console.log('🧪 Teste rápido - 1 página apenas\n');

try {
  const result = await scrapeSofifaPlayersBatch(url, 0, 0, 1);
  
  if (result.success && result.players) {
    console.log(`✅ ${result.players.length} jogadores\n`);
    console.log('Primeiros 3:');
    result.players.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.nome} - ${p.pais}`);
    });
  } else {
    console.log(`❌ ${result.error}`);
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}

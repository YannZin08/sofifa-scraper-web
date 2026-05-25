import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';
console.log('🧪 Testando JSON com países em português...\n');

try {
  const result = await scrapeSofifaPlayersBatch(url, 0, 80, 1);
  
  if (result.success && result.players) {
    console.log(`✅ Extraídos ${result.players.length} jogadores\n`);
    
    // Mostrar primeiros 5 jogadores com seus países
    console.log('📋 Primeiros 5 jogadores:');
    result.players.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. ${p.nome} - País: ${p.pais} - Overall: ${p.overall}`);
    });
    
    // Verificar se há países em português
    const paisesUnicos = [...new Set(result.players.map(p => p.pais))];
    console.log(`\n🌍 Países únicos: ${paisesUnicos.length}`);
    console.log('Amostra de países:');
    paisesUnicos.slice(0, 10).forEach(p => console.log(`  - ${p}`));
  } else {
    console.log(`❌ Erro: ${result.error}`);
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}

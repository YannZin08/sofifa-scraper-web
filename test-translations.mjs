import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

// Testar com URL em espanhol
const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';
console.log('🧪 Testando traduções de países (Espanhol/Francês)...\n');

try {
  const result = await scrapeSofifaPlayersBatch(url, 0, 80, 1);
  
  if (result.success && result.players) {
    console.log(`✅ Extraídos ${result.players.length} jogadores\n`);
    
    // Mostrar países únicos
    const countries = [...new Set(result.players.map(p => p.pais))];
    console.log('🌍 Países encontrados:');
    countries.slice(0, 10).forEach(c => console.log(`  - ${c}`));
    
    // Verificar se há países em português
    const ptCountries = countries.filter(c => 
      c.includes('ã') || c.includes('é') || c.includes('ç') || c.includes('á')
    );
    console.log(`\n✅ Países em português: ${ptCountries.length}/${countries.length}`);
  } else {
    console.log(`❌ Erro: ${result.error}`);
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}

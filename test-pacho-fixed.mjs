import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('🔍 Teste de extração com correção de posições\n');

try {
  const startTime = Date.now();
  const result = await scrapeSofifaPlayersBatch(url, 0, 160, 80); // Apenas 2 páginas para teste rápido
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Extração concluída em ${duration}s`);
  console.log(`📊 Total de jogadores: ${result.count || result.players.length}`);
  
  // Procurar por Pacho
  const pacho = result.players.find(p => p.nome.includes('Pacho'));
  if (pacho) {
    console.log(`\n✅ W. Pacho encontrado:`);
    console.log(`   Nome: ${pacho.nome}`);
    console.log(`   Posições: ${pacho.posicoes.join(', ') || 'NENHUMA'}`);
    console.log(`   Overall: ${pacho.overall}`);
    console.log(`   País: ${pacho.pais}`);
  } else {
    console.log('\n❌ W. Pacho não encontrado');
  }
  
  console.log('\n📋 Primeiros 5 jogadores:');
  result.players.slice(0, 5).forEach((p, i) => {
    const pos = p.posicoes.length > 0 ? p.posicoes.join('/') : '(sem posição)';
    console.log(`${i+1}. ${p.nome} - ${pos} (Overall: ${p.overall})`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}

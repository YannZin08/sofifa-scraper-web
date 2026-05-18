import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('🔍 Teste final com mapeamento correto de posições\n');

try {
  const startTime = Date.now();
  const result = await scrapeSofifaPlayersBatch(url, 0, 160, 80);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Extração concluída em ${duration}s`);
  console.log(`📊 Total de jogadores: ${result.count || result.players.length}\n`);
  
  console.log('📋 Primeiros 10 jogadores com posições:');
  result.players.slice(0, 10).forEach((p, i) => {
    const pos = p.posicoes.length > 0 ? p.posicoes.join(', ') : '(sem posição)';
    console.log(`${i+1}. ${p.nome.padEnd(20)} → ${pos}`);
  });
  
  // Verificar Pacho especificamente
  const pacho = result.players.find(p => p.nome.includes('Pacho'));
  if (pacho) {
    console.log(`\n✅ W. Pacho: ${pacho.posicoes.join(', ') || '(sem posição)'}`);
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}

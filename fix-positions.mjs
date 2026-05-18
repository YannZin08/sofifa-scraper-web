import fs from 'fs';

const file = '/home/ubuntu/sofifa-scraper-web/server/scraperService.ts';
let content = fs.readFileSync(file, 'utf-8');

// Encontrar e substituir o mapeamento de posições
const oldMapping = `const POSITION_TRANSLATIONS: Record<string, string> = {
  'GK': 'GOL',
  'RB': 'LD',
  'CB': 'ZAG',
  'LB': 'LE',
  'CDM': 'VOL',
  'CM': 'MC',
  'CAM': 'MEI',
  'RM': 'MD',
  'RW': 'PD',
  'LM': 'ME',
  'LW': 'PE',
  'ST': 'ATA',
  // Posicoes adicionais para cobertura completa
  'CF': 'ATA',
  'LWB': 'ADE',
  'RWB': 'ADD',
  'LCM': 'MC',
  'RCM': 'MC',
  'LDM': 'VOL',
  'RDM': 'VOL',
  'LAM': 'MEI',
  'RAM': 'MEI',
  'LF': 'SA',
  'RF': 'SA',
  'AT': 'ATA',
  'EE': 'PE',
  'ED': 'MD',
  'SA': 'SA',
};`;

const newMapping = `const POSITION_TRANSLATIONS: Record<string, string> = {
  // Posições principais (conforme tabela do usuário)
  'GK': 'GOL',
  'RB': 'LD',
  'CB': 'ZAG',
  'LB': 'LE',
  'CDM': 'VOL',
  'CM': 'MC',
  'CAM': 'MEI',
  'RM': 'MD',
  'RW': 'PD',
  'LM': 'ME',
  'LW': 'PE',
  'ST': 'ATA',
  
  // Variações e posições adicionais (mapeadas para equivalentes)
  'CF': 'ATA',      // Center Forward → Atacante
  'LWB': 'LE',      // Left Wing Back → Lateral Esquerdo
  'RWB': 'LD',      // Right Wing Back → Lateral Direito
  'LCM': 'MC',      // Left Center Mid → Meio Campo
  'RCM': 'MC',      // Right Center Mid → Meio Campo
  'LDM': 'VOL',     // Left Defensive Mid → Volante
  'RDM': 'VOL',     // Right Defensive Mid → Volante
  'LAM': 'MEI',     // Left Attacking Mid → Meia
  'RAM': 'MEI',     // Right Attacking Mid → Meia
  'LF': 'PE',       // Left Forward → Ponta Esquerda
  'RF': 'PD',       // Right Forward → Ponta Direita
  'AT': 'ATA',      // Attacker → Atacante
};`;

content = content.replace(oldMapping, newMapping);

fs.writeFileSync(file, content, 'utf-8');
console.log('✅ Mapeamento de posições atualizado!');

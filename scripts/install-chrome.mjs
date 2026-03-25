#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const chromeCachePath = join(homedir(), '.cache', 'puppeteer');

console.log('🔍 Verificando se o Chrome está instalado...');

// Verificar se o Chrome já está instalado
if (existsSync(chromeCachePath)) {
  const chromeExecutable = join(chromeCachePath, 'chrome', 'linux-146.0.7680.153', 'chrome-linux64', 'chrome');
  if (existsSync(chromeExecutable)) {
    console.log('✅ Chrome já está instalado!');
    process.exit(0);
  }
}

// Instalar dependências de sistema necessárias para o Chrome
console.log('📦 Instalando dependências de sistema necessárias para o Chrome...');

const systemDeps = [
  'libglib-2.0-0',
  'libx11-6',
  'libx11-xcb1',
  'libxcb1',
  'libxext6',
  'libxfixes3',
  'libxi6',
  'libxrandr2',
  'libxrender1',
  'libxss1',
  'libxtst6',
  'libnss3',
  'libgconf-2-4',
  'libappindicator1',
  'libindicator7',
  'libgbm1',
  'libpangocairo-1.0-0',
  'libpango-1.0-0',
  'libatk1.0-0',
  'libcairo2',
  'libcups2',
  'libdbus-1-3',
  'libexpat1',
  'libfontconfig1',
  'libfreetype6',
  'libgdk-pixbuf2.0-0',
  'libglib2.0-0',
  'libgtk-3-0',
  'libharfbuzz0b',
  'libpango-1.0-0',
  'libpangoft2-1.0-0',
  'libpixman-1-0',
  'libpng16-16',
  'libxcb-render0',
  'libxcb-shm0',
  'libxcb-xfixes0',
  'libxcb-xkb1',
  'libxkbcommon0',
  'libxkbcommon-x11-0',
  'libxcomposite1',
  'libxcursor1',
  'libxdamage1',
  'libxinerama1',
  'libxkbfile1',
  'libxmu6',
  'libxmuu1',
  'libxpm4',
  'libxrandr2',
  'libxres1',
  'libxshmfence1',
  'libxtst6',
  'libxv1',
  'libxvmc1',
  'libxvmc1',
  'libxext6',
  'libxfixes3',
  'libxfont2',
  'libxfont-common',
  'libxi6',
  'libxinerama1',
  'libxkbcommon0',
  'libxkbfile1',
  'libxkbui1',
  'libxmu6',
  'libxmuu1',
  'libxpm4',
  'libxrandr2',
  'libxrender1',
  'libxres1',
  'libxss1',
  'libxshmfence1',
  'libxt6',
  'libxtst6',
  'libxv1',
  'libxvmc1',
  'libxvmc1',
  'libxvmc1',
  'libxvmc1',
  'libxxf86dga1',
  'libxxf86vm1',
  'fonts-dejavu-core',
  'fonts-liberation',
  'fonts-noto-cjk',
  'xfonts-encodings',
  'xfonts-utils'
];

const installDepsProcess = spawn('apt-get', ['update', '&&', 'apt-get', 'install', '-y', ...systemDeps], {
  stdio: 'inherit',
  shell: true
});

installDepsProcess.on('close', (code) => {
  if (code !== 0 && code !== 1) {
    console.warn('⚠️  Aviso: Alguns pacotes podem não ter sido instalados, mas continuando...');
  }

  // Agora instalar o Chrome
  console.log('📥 Instalando Chrome para Puppeteer...');

  const installProcess = spawn('npx', ['puppeteer', 'browsers', 'install', 'chrome'], {
    stdio: 'inherit',
    shell: true
  });

  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Chrome instalado com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Erro ao instalar Chrome');
      process.exit(1);
    }
  });

  installProcess.on('error', (err) => {
    console.error('❌ Erro ao executar instalação:', err);
    process.exit(1);
  });
});

installDepsProcess.on('error', (err) => {
  console.error('⚠️  Aviso ao instalar dependências de sistema:', err);
  console.log('Tentando instalar Chrome mesmo assim...');

  const installProcess = spawn('npx', ['puppeteer', 'browsers', 'install', 'chrome'], {
    stdio: 'inherit',
    shell: true
  });

  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Chrome instalado com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Erro ao instalar Chrome');
      process.exit(1);
    }
  });
});

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

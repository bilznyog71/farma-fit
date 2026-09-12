const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('📦 Iniciando processo de build (produção)...');

// Limpar ou criar diretório dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

// Arquivos e diretórios a serem incluídos no bundle de distribuição
const itemsToCopy = ['index.html', 'css', 'js', 'assets'];

let totalFiles = 0;
let totalBytes = 0;

itemsToCopy.forEach(item => {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(distDir, item);

  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
    console.log(` ✓ Copiado: ${item}`);
  }
});

// Calcular métricas do build
function calculateMetrics(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      calculateMetrics(fullPath);
    } else {
      totalFiles++;
      totalBytes += fs.statSync(fullPath).size;
    }
  }
}

calculateMetrics(distDir);

const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);
console.log(`\n✨ Build finalizado com sucesso!`);
console.log(`📁 Diretório de saída: dist/`);
console.log(`📄 Total de arquivos: ${totalFiles}`);
console.log(`💾 Tamanho do pacote: ${sizeMb} MB (${totalBytes.toLocaleString('pt-BR')} bytes)\n`);

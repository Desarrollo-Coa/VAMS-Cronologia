const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceImage = path.join(__dirname, '../public/ICONS NEW.jpg');
const outputDir = path.join(__dirname, '../public');

// Tamaños de iconos requeridos según manifest.json y estándares PWA
const iconSizes = [
  { size: 32, name: 'icon-light-32x32.png' },
  { size: 32, name: 'icon-dark-32x32.png' }, // Versión dark
  { size: 96, name: 'icon-96x96.png' }, // Para shortcuts
  { size: 192, name: 'icon-192x192.png' }, // PWA estándar
  { size: 512, name: 'icon-512x512.png' }, // PWA estándar
  { size: 180, name: 'apple-icon.png' }, // Tamaño estándar para Apple (180x180)
];

async function generateIcons() {
  try {
    // Verificar que existe la imagen fuente
    if (!fs.existsSync(sourceImage)) {
      console.error(`❌ Error: No se encontró la imagen fuente: ${sourceImage}`);
      process.exit(1);
    }

    console.log('🔄 Generando iconos desde:', sourceImage);
    console.log('📁 Directorio de salida:', outputDir);
    console.log('');

    // Generar cada tamaño de icono
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name);
      
      try {
        await sharp(sourceImage)
          .resize(size, size, {
            fit: 'cover',
            position: 'center',
          })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generado: ${name} (${size}x${size})`);
      } catch (error) {
        console.error(`❌ Error generando ${name}:`, error.message);
      }
    }

    console.log('');
    console.log('✨ ¡Iconos generados exitosamente!');
    console.log('');
    console.log('📝 Iconos generados:');
    console.log('   ✅ icon-light-32x32.png (32x32)');
    console.log('   ✅ icon-dark-32x32.png (32x32)');
    console.log('   ✅ icon-96x96.png (96x96) - para shortcuts');
    console.log('   ✅ icon-192x192.png (192x192) - PWA');
    console.log('   ✅ icon-512x512.png (512x512) - PWA');
    console.log('   ✅ apple-icon.png (180x180) - Apple');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

// Ejecutar
generateIcons();


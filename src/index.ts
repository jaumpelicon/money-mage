import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';
import 'dotenv/config';
import whatsappController from './controllers/WhatsappController';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se a API key está configurada
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ERRO: ANTHROPIC_API_KEY não configurada no arquivo .env');
  console.log("KEY NO AISERVICE:", process.env.ANTHROPIC_API_KEY);
  process.exit(1);
}

console.log('🚀 Iniciando Money Mage - WhatsApp Finance Bot...');

// Criar cliente WhatsApp com configuração otimizada
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    // Timeout aumentado para dar tempo do Chrome baixar
    timeout: 60000
  },
  // Configurações adicionais para estabilidade
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  }
});

// Evento: QR Code para autenticação
client.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n💡 Como escanear:');
  console.log('1. Abra o WhatsApp no celular');
  console.log('2. Toque em Menu (⋮) > Aparelhos conectados');
  console.log('3. Toque em "Conectar um aparelho"');
  console.log('4. Aponte a câmera para o QR Code acima\n');
});

// Evento: Carregando
client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Carregando: ${percent}% - ${message}`);
});

// Evento: Cliente pronto
client.on('ready', () => {
  console.log('\n✅ Money Mage conectado e pronto!');
  console.log('🧙‍♂️ Seu assistente financeiro está ativo!');
  console.log('📱 Aguardando mensagens...\n');
});

// Evento: Autenticação bem-sucedida
client.on('authenticated', () => {
  console.log('🔐 Autenticado com sucesso!');
});

// Evento: Falha na autenticação
client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
  console.log('💡 Dica: Tente remover a pasta .wwebjs_auth e reconectar');
});

// Evento: Desconectado
client.on('disconnected', (reason) => {
  console.log('⚠️ Bot desconectado:', reason);
  console.log('🔄 Tentando reconectar...');
});

// Evento: Receber mensagem
client.on('message', async (message) => {
  try {
    // Ignorar mensagens de grupos e status
    if (message.from.includes('@g.us') || message.from.includes('status')) {
      return;
    }

    // Ignorar mensagens do próprio bot
    if (message.fromMe) {
      return;
    }

    console.log(`📨 Mensagem recebida de ${message.from}: ${message.body}`);

    // Processar mensagem
    await whatsappController.handleMessage(message);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    try {
      await message.reply(
        '😔 Desculpe, ocorreu um erro ao processar sua mensagem.\n' +
        'Por favor, tente novamente em alguns instantes.'
      );
    } catch (replyError) {
      console.error('❌ Erro ao enviar mensagem de erro:', replyError);
    }
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  console.log('💡 Dica: Se o erro persistir, tente:');
  console.log('   1. rm -rf node_modules .wwebjs_auth');
  console.log('   2. npm install');
  console.log('   3. npm run dev');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Tratamento de sinais de término
process.on('SIGINT', async () => {
  console.log('\n⚠️ Encerrando Money Mage...');
  await client.destroy();
  console.log('👋 Até logo!');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Encerrando Money Mage...');
  await client.destroy();
  console.log('👋 Até logo!');
  process.exit(0);
});

// Inicializar cliente
console.log('⏳ Inicializando cliente WhatsApp...');
console.log('⏳ Baixando Chromium (pode demorar na primeira vez)...\n');

client.initialize().catch(error => {
  console.error('❌ Erro ao inicializar cliente:', error);
  console.log('\n💡 Soluções possíveis:');
  console.log('1. Instale o Chrome/Chromium manualmente');
  console.log('2. Execute: npm install puppeteer');
  console.log('3. Execute: rm -rf node_modules && npm install');
  process.exit(1);
});
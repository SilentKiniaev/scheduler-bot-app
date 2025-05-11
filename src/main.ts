import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './config/interfaces/configuration.interface';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get<DataSource>(DataSource);
  const configService = app.get(ConfigService);
  const botConfig = configService.get<Configuration['bot']>('bot');
  const appConfig = configService.get<Configuration['app']>('app');
  console.log('token:', botConfig.token, getBotToken());
  if (appConfig?.host && botConfig?.webhook?.hookPath) {
    const token = getBotToken(); 
    console.log('host:', appConfig.host);
    console.log('wehook path:', botConfig.webhook.hookPath);
    const bot = app.get(getBotToken());
    app.use(bot.webhookCallback(botConfig.webhook.hookPath));
  }
  await dataSource.runMigrations();
  const port = configService.get<number>('app.port');
  await app.listen(port, () => console.log(`Successfully started at ${port}`));
}
bootstrap();

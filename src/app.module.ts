import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { Configuration } from './config/interfaces/configuration.interface';
import { BotModule } from './modules/bot/bot.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TelegrafModule.forRootAsync({
      // imports: [ConfigModule],
      // botName: '',
      useFactory: (config: ConfigService) => {
        const botConfig = config.get<Configuration['bot']>('bot');
        const appConfig = config.get<Configuration['app']>('app');
        return {
          token: botConfig.token,
          launchOptions: appConfig?.host && botConfig?.webhook?.hookPath ? {
            webhook: {
              domain: appConfig.host,
              hookPath: botConfig.webhook.hookPath,
            }
          } : {},
          include: [BotModule]
        }
      },
      inject: [ConfigService]
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        database: config.get<string>('db.database'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        entities: [
          path.join(__dirname, './modules/**/*.entity{.js,.ts}'),
        ],
        migrations: [
          path.join(__dirname, './database/migrations/*{.js,.ts}'),
          path.join(__dirname, './database/seeds/*{.js,.ts}'),
        ],
        // synchronize: true,
        logging: true
      }),
      inject: [ConfigService],
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

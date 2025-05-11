import { Configuration } from './interfaces/configuration.interface';

export default (): Configuration => ({
    bot: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        webhook: {
            hookPath: process.env.TELEGRAM_WEBHOOK_PATH,
        }
    },
    db: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
    },
    app: {
        port: +process.env.APP_PORT || 3000,
        host: process.env.APP_HOST,
        isSslEnabled: process.env.APP_SSL_ENABLED === 'true',
    }
});
export interface Configuration {
    bot: {
        token: string;
        webhook?: {
            hookPath: string;
        }
    },
    db: {
        host: string;
        port: string;
        database: string;
        username: string;
        password: string;
    },
    app: {
        port: number;
        host: string;
        isSslEnabled: boolean;
    }
}
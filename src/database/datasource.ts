import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

export const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: +process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    entities: [
        path.join(__dirname, '../**/*.entity.ts'),
    ],
});
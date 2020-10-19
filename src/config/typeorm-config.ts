import { TypeOrmModuleOptions } from '@nestjs/typeorm';
require('dotenv').config();
import { get } from 'config';
const dbConfig = get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: dbConfig.type,
    host: dbConfig.host || process.env.RDS_HOSTNAME,
    port: dbConfig.port || process.env.RDS_PORT,
    username: dbConfig.username || process.env.RDS_USERNAME,
    password: dbConfig.password || process.env.RDS_PASSWORD,
    database: dbConfig.database || process.env.RDS_DB_NAME,
    synchronize: dbConfig.synchronize || process.env.TYPEORM_SYNC,
    dropSchema: dbConfig.dropSchema,
    logging: true, //["error"],
    maxQueryExecutionTime: 1000, //log queries that run for more than 1 sec
    cache: {
        duration: 10000 // 10 seconds
    }
};
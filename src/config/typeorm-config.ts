import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { get } from 'config';

const dbConfig = get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: dbConfig.type,
    host: process.env.RDS_HOSTNAME || dbConfig.host,
    port: process.env.RDS_PORT || dbConfig.port,
    username: process.env.RDS_USERNAME || dbConfig.username,
    password: process.env.RDS_PASSWORD || dbConfig.password,
    database: process.env.RDS_DB_NAME || dbConfig.database,
    synchronize: process.env.TYPEORM_SYNC || dbConfig.synchronize,
    dropSchema: dbConfig.dropSchema,
    logging: true, //["error"],
    maxQueryExecutionTime: 2500, //log queries that run for more than 2.5 sec
    cache: {
        duration: 10000 // 10 seconds
    }
};
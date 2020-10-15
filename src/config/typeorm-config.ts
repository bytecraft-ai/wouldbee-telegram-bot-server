import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { get } from 'config';

const dbConfig = get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: dbConfig.type,
    url: dbConfig.url.replace('<password>', dbConfig.password).replace('<dbname>', dbConfig.database || process.env.MONGODB_PASSWORD),
    entities: [__dirname + '/../**/*.entity.{js,ts}', __dirname + '/../**/entities/*.entity.{js,ts}'],
    // set synchronize: false to work around a typeorm bug
    synchronize: false, //process.env.TYPEORM_SYNC || dbConfig.synchronize,
    dropSchema: dbConfig.dropSchema,
    logging: true, //["error"],
    maxQueryExecutionTime: 2500, // log all queries which run more then 2.5 second
    cache: {
        duration: 10000 // 10 seconds
    },
    useNewUrlParser: true,  // required for mongo
    useUnifiedTopology: true  // required for mongo
};
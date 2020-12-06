import { LoggerModule } from "nestjs-pino";

export const conditionalImports = process.env.NODE_ENV === 'production' && process.env.USE_PINO_LOGGER === 'true'
    ? [LoggerModule.forRoot()]
    : [];
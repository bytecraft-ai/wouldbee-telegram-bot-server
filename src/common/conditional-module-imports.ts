import { LoggerModule } from "nestjs-pino";

export const conditionalImports = process.env.NODE_ENV === 'production' ? [LoggerModule.forRoot()] : [];
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: path.join(__dirname, './dist/env'),
});

const databaseConfig = {
  type: 'mysql',
  host: process.env.mysql_server_host,
  port: parseInt(process.env.mysql_server_port),
  username: process.env.mysql_server_user,
  password: process.env.mysql_server_password,
  database: process.env.mysql_server_database,
  synchronize: true,
  logging: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['src/migration/1714836982951-meeting.migration.ts'],
  subscribers: [],
  poolSize: 10,
  connectorPackage: 'mysql2',
  extra: {
    authPlugin: 'sha256_password',
  },
} satisfies DataSourceOptions;
// export const typeormConfig = {
//   ...databaseConfig,
// //   url: process.env.DATABASE_URL,
//   synchronize: false,
// };

const appDataSource = new DataSource(databaseConfig);
export default appDataSource;

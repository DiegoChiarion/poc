import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { LoginController } from './controllers/login.controller';
import { WalletEntity } from './entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      username: 'pocadmin',
      password: 'password102030',
      port: 5432,
      database: 'poc_database',
      entities: [UserEntity, WalletEntity],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([UserEntity, WalletEntity]),
  ],
  controllers: [UserController, LoginController],
  providers: [],
})
export class AppModule {}

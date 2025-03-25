import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  UpdatedUserNameRequestDTO,
  UpdatedUserNameResponseDTO,
} from './dtos/update-user-name.dto';
import {
  CreateUserRequestDTO,
  CreateUserResponseDTO,
} from './dtos/create-user.dto';
import { UpdateUserPasswordRequestDTO } from './dtos/update-user-password.dto';
import * as bcrypt from 'bcrypt';
import { GetUsersResponseDTO } from './dtos/get-users.dto';
import { GetUserByIdResponseDTO } from './dtos/get-user-by-id.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { WalletEntity } from './entities/wallet.entity';

@Controller('users')
export class UserController {
  constructor(
    @InjectDataSource() private readonly _dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly _walletRepository: Repository<WalletEntity>,
  ) {}

  private async _comparePassword(
    hashsedPassword: string,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashsedPassword);
  }

  private async _hashPassword(password: string): Promise<string> {
    const saltRounds = 10;

    return bcrypt.hash(password, saltRounds);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getUsers(): Promise<GetUsersResponseDTO> {
    const response: GetUsersResponseDTO = { users: [] };

    const users = await this._userRepository.find();

    for (const user of users) {
      const wallet = await this._walletRepository.findOne({
        where: { userId: user.id },
      });

      response.users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        wallet: wallet ? { id: wallet.id, balance: wallet.balance } : null, // ou {}
      });
    }
    return response;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(
    @Body() body: CreateUserRequestDTO,
  ): Promise<CreateUserResponseDTO> {
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    try {
      const hashedPassword = await this._hashPassword(body.password);

      const user = await manager.save(UserEntity, {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      });

      const wallet = await manager.save(WalletEntity, {
        userId: user.id,
        balance: 100,
      });

      await queryRunner.commitTransaction();

      return {
        id: user.id,
        name: user.name,
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(':userId')
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<GetUserByIdResponseDTO> {
    const user = await this._userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not exist.');
    }

    const wallet = await this._walletRepository.findOne({
      where: { userId: userId },
    });

    if (!wallet) {
      throw new InternalServerErrorException('Wallet not exist.');
    }

    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      email: user.email,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
      },
    };
  }

  @HttpCode(HttpStatus.OK)
  @Put(':userId')
  async updatedUserName(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdatedUserNameRequestDTO,
  ): Promise<UpdatedUserNameResponseDTO> {
    const selectUser = await this._userRepository.findOne({
      where: { id: userId },
    });

    if (!selectUser) {
      throw new NotFoundException('User not exist.');
    }

    await this._userRepository.update(userId, { name: body.name });

    return { id: selectUser.id, name: selectUser.name };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId/password')
  async updateUserPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserPasswordRequestDTO,
  ): Promise<void> {
    const selectUser = await this._userRepository.findOne({
      where: { id: userId },
    });

    if (!selectUser) {
      throw new NotFoundException('User not exist.');
    }

    const hashPassword = await this._hashPassword(body.password);

    const comparePassword = await this._comparePassword(
      selectUser.password,
      body.password,
    );

    if (comparePassword) {
      throw new BadRequestException('Senhas devem ser diferentes.');
    }

    await this._userRepository.update(userId, {
      password: hashPassword,
    });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userId')
  async removeUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    try {
      const selectUser = await manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!selectUser) {
        throw new NotFoundException('User not found.');
      }

      await manager.delete(WalletEntity, { userId: userId });

      await manager.delete(UserEntity, { id: userId });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

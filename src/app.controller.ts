import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { UserModel } from 'src/models/user';
import { UpdatedUserNameRequestDTO } from './dtos/update-user-name.dto';
import {
  CreateUserRequestDTO,
  CreateUserResponseDTO,
} from './dtos/create-user.dto';
import { UpdateUserPasswordRequestDTO } from './dtos/update-user-password.dto';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { GetUsersResponseDTO } from './dtos/get-users.dto';
import { GetUserByIdResponseDTO } from './dtos/get-user-by-id.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';

@Controller('users')
export class AppController {
  private _database: Pool;

  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {
    this._database = new Pool({
      host: 'localhost',
      user: 'pocadmin',
      password: 'password102030',
      port: 5432,
      database: 'poc_database',
    });
  }

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
    const users = await this._userRepository.find();

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
      })),
    };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(
    @Body() body: CreateUserRequestDTO,
  ): Promise<CreateUserResponseDTO> {
    const hashedPassword = await this._hashPassword(body.password);

    const user = await this._userRepository.save({
      name: body.name,
      password: hashedPassword,
    });

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':userId')
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<GetUserByIdResponseDTO> {
    const selectUser = await this._userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name'],
    });

    if (!selectUser) {
      throw new NotFoundException('User not exist.');
    }

    return {
      id: selectUser.id,
      name: selectUser.name,
      createdAt: selectUser.createdAt,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Put(':userId')
  async updatedUserName(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdatedUserNameRequestDTO,
  ): Promise<{ id: string; name: string }> {
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
    const selectUser = await this._userRepository.delete(userId);

    if (!selectUser) {
      throw new NotFoundException('User not exist.');
    }
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { UserModel } from 'src/models/user';
import { UpdatedUserNameRequestDTO } from './dtos/update-user-name.dto';
import { randomUUID } from 'crypto';
import { CreateUserRequestDTO } from './dtos/create-user.dto';
import { UpdateUserPasswordRequestDTO } from './dtos/update-user-password.dto';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

@Controller('users')
export class AppController {
  private _database: Pool;
  users: UserModel[] = [];

  constructor() {
    this._database = new Pool({
      host: 'localhost',
      user: 'pocadmin',
      password: 'password102030',
      port: 5432,
      database: 'poc_database',
    });
  }

  private async _hashPassword(password: string): Promise<string> {
    const saltRounds = 10;

    return bcrypt.hash(password, saltRounds);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  getUsers(): { id: string; name: string }[] {
    return this.users.map((user) => ({ id: user.id, name: user.name }));
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(
    @Body() body: CreateUserRequestDTO,
  ): Promise<{ id: string; name: string }> {
    const hashedPassword = await this._hashPassword(body.password);

    const response = await this._database.query<UserModel>(
      `
        INSERT INTO "users"
        ("name", "password")
        VALUES ($1, $2)
        RETURNING
          id AS "id",
          name AS "name",
          password AS "password"
      `,
      [body.name, hashedPassword],
    );

    const user = response.rows[0];

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':userId')
  getUserById(@Param('userId') userId: string): { id: string; name: string } {
    if (!userId) {
      throw new BadRequestException('userId invalid.');
    }
    const user = this.users.find((user) => user.id === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.OK)
  @Put(':userId')
  updatedUserName(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdatedUserNameRequestDTO,
  ): { id: string; name: string } {
    const user = this.users.find((user) => user.id === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.name = body.name;

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.OK)
  @Put(':userId/password')
  async updateUserPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserPasswordRequestDTO,
  ): Promise<{ id: string; name: string }> {
    const user = this.users.find((user) => user.id === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.password = await this._hashPassword(body.password);

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userId')
  removeUser(@Param('userId', ParseUUIDPipe) userId: string): void {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    this.users = this.users.filter((item) => userId !== item.id);
  }
}

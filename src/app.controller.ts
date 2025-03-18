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
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { UserModel } from 'src/models/user';
import { UpdatedUserNameRequestDTO } from './dtos/update-user-name.dto';
import { CreateUserRequestDTO } from './dtos/create-user.dto';
import { UpdateUserPasswordRequestDTO } from './dtos/update-user-password.dto';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { GetUsersResponseDTO } from './dtos/get-users.dto';

@Controller('users')
export class AppController {
  private _database: Pool;

  constructor() {
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
    const response = await this._database.query<UserModel>(
      `
      SELECT
        id AS "id",
        name AS "name",
        password AS "password",
        created_at AS "createdAt"
      FROM "users"
      `,
    );

    const users = response.rows.map((user) => ({
      id: user.id,
      name: user.name,
    }));

    return {
      users,
    };
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
          password AS "password",
          created_at AS "createdAt"
      `,
      [body.name, hashedPassword],
    );

    const user = response.rows[0];

    return { id: user.id, name: user.name };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':userId')
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<{ id: string; name: string }> {
    const selectUser = await this._database.query(
      `
      SELECT EXISTS (SELECT 1 FROM "users" AS u WHERE u.id = $1);
      `,
      [userId],
    );

    if (!selectUser.rows[0].exists) {
      throw new NotFoundException('User not exist.');
    }

    const response = await this._database.query<UserModel>(
      `
      SELECT
        u.id AS "id",
        u.name AS "name",
        u.password AS "password",
        u.created_at AS "createdAt"
      FROM "users" AS u
      WHERE id = $1
      `,
      [userId],
    );
    return { id: response.rows[0].id, name: response.rows[0].name };
  }

  @HttpCode(HttpStatus.OK)
  @Put(':userId')
  async updatedUserName(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdatedUserNameRequestDTO,
  ): Promise<{ id: string; name: string }> {
    const selectUser = await this._database.query(
      `
      SELECT EXISTS (SELECT 1 FROM "users" AS u WHERE u.id = $1);
      `,
      [userId],
    );

    if (!selectUser.rows[0].exists) {
      throw new NotFoundException('User not exist.');
    }

    const response = await this._database.query<UserModel>(
      `
      UPDATE "users"
        SET name = $1
      WHERE id = $2
      RETURNING 
        id AS "id", 
        name AS "name",
        password AS "password",
        created_at AS "createdAt"
      `,
      [body.name, userId],
    );

    return { name: response.rows[0].name, id: response.rows[0].id };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':userId/password')
  async updateUserPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserPasswordRequestDTO,
  ): Promise<void> {
    const selectUser = await this._database.query<UserModel>(
      `
      SELECT
        u.id AS "id",
        u.name AS "name",
        u.password AS "password",
        u.created_at AS "createdAt"
      FROM "users" AS u
      WHERE u.id = $1
      `,
      [userId],
    );

    if (!selectUser.rows[0]) {
      throw new NotFoundException('User not exist.');
    }

    const hashPassword = await this._hashPassword(body.password);

    const comparePassword = await this._comparePassword(
      selectUser.rows[0].password,
      body.password,
    );
    if (comparePassword) {
      throw new BadRequestException('Senhas devem ser diferentes.');
    }

    await this._database.query(
      `
      UPDATE "users"
        SET password = $1
      WHERE id = $2
    `,
      [hashPassword, userId],
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userId')
  async removeUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    const selectUser = await this._database.query(
      `
      SELECT EXISTS (SELECT 1 FROM "users" AS u WHERE u.id = $1);
      `,
      [userId],
    );

    if (!selectUser.rows[0].exists) {
      throw new NotFoundException('User not exist.');
    }

    await this._database.query(
      `
      DELETE
      FROM "users"
      WHERE id = $1
      `,
      [userId],
    );
  }
}

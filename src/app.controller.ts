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
import { promises } from 'dns';

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
  async getUsers(): Promise<{ id: string; name: string }[]> {
    const response = await this._database.query<UserModel>(
      `
      SELECT
        id AS "id",
        name AS "name",
        password AS "password"
      FROM "users"
      `,
    );

    return response.rows.map((users) => ({
      id: users.id,
      name: users.name,
    }));
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
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<{ id: string; name: string }> {
    const selectUser = await this._database.query<UserModel>(
      `
      SELECT
        u.id AS "id",
        u.name AS "name",
        u.password AS "password"
      FROM "users" AS u
      WHERE id = $1
      `,
      [userId],
    );

    if (!selectUser.rows[0]) {
      throw new NotFoundException('User not exist.');
    }

    const response = await this._database.query<UserModel>(
      `
      SELECT
        id AS "id",
        name AS "name",
        password AS "password"
      FROM "users"
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
    const selectUser = await this._database.query<UserModel>(
      `
      SELECT
        u.id AS "id",
        u.name AS "name",
        u.password AS "password"
      FROM "users" AS u
      WHERE id = $1
      `,
      [userId],
    );

    if (!selectUser.rows[0]) {
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
        password AS "password";
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
        u.password AS "password"
      FROM "users" AS u
      WHERE id = $1
      `,
      [userId],
    );

    if (!selectUser.rows[0]) {
      throw new NotFoundException('User not exist.');
    }

    const hashPassword = await this._hashPassword(body.password);

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
  ): Promise<{ id: string; name: string }> {
    const selectUser = await this._database.query<UserModel>(
      `
      SELECT
        u.id AS "id",
        u.name AS "name",
        u.password AS "password"
      FROM "users" AS u
      WHERE id = $1
      `,
      [userId],
    );

    if (!selectUser.rows[0]) {
      throw new NotFoundException('User not exist.');
    }

    const response = await this._database.query<UserModel>(
      `
      DELETE
      FROM "users"
      WHERE id = $1
      RETURNING id, name
      `,
      [userId],
    );

    return { id: response.rows[0].id, name: response.rows[0].name };
  }
}

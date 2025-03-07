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

@Controller('users')
export class AppController {
  users: UserModel[] = [];

  constructor() {}

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
    const generatedId = randomUUID();
    const hashedPassword = await this._hashPassword(body.password);
    const user = new UserModel(generatedId, body.name, hashedPassword);
    this.users.push(user);

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

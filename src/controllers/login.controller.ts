import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { LoginRequestDTO, LoginResponseDTO } from '../dtos/login.dto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

@Controller('login')
export class LoginController {
  private readonly _jwtKey = 'admin102030';

  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {}

  private async _comparePassword(
    hashedPassword: string,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  async login(@Body() body: LoginRequestDTO): Promise<LoginResponseDTO> {
    const user = await this._userRepository.findOne({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not exist.');
    }

    const comparePassword = await this._comparePassword(
      user.password,
      body.password,
    );

    if (!comparePassword) {
      throw new NotFoundException('Password is wrong.');
    }

    const token = jwt.sign({ id: user.id }, this._jwtKey, {
      algorithm: 'HS256',
      expiresIn: '86400s',
    });

    return { token };
  }
}

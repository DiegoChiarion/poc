import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

export interface UserRequest extends Request {
  user: UserEntity;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {}

  private readonly _jwtKey = 'admin102030';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token não fornecido.');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer não informado.');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decode = jwt.verify(token, this._jwtKey, {
        algorithms: ['HS256'],
      }) as { id?: string };

      if (!decode.id) {
        throw new BadRequestException('Token inválido.');
      }

      const user = await this._userRepository.findOne({
        where: {
          id: decode.id,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não autorizado.');
      }

      request.user = user;

      return true;
    } catch (err) {
      if ('name' in err) {
        if (err.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Token inválido.');
        }

        if (err.name === 'TokenExpiredError') {
          throw new ForbiddenException('Token expirado.');
        }
      }

      throw new InternalServerErrorException(err);
    }
  }
}

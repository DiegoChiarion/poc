import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
export interface CustomRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly _jwtKey = 'admin102030';
  // constructor() {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido.');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decode = jwt.verify(token, this._jwtKey, { algorithms: ['HS256'] });

      request.user = decode;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}

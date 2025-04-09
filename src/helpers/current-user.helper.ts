import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { UserRequest } from 'src/guards/auth.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest<UserRequest>();

    return request.user;
  },
);

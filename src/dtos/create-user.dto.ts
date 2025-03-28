import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserRequestDTO {
  @IsNotEmpty()
  name: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class CreateUserResponseDTO {
  id: string;
  name: string;
  wallet: {
    id: string;
    balance: number;
  };
}

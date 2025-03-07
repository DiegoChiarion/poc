import { IsAlpha, IsNotEmpty } from 'class-validator';

export class UpdatedUserNameRequestDTO {
  @IsNotEmpty()
  @IsAlpha()
  name: string;
}

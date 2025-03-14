import { IsNotEmpty } from 'class-validator';

export class UpdatedUserNameRequestDTO {
  @IsNotEmpty()
  name: string;
}

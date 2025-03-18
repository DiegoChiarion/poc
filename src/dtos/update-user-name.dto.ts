import { IsNotEmpty } from 'class-validator';

export class UpdatedUserNameRequestDTO {
  @IsNotEmpty()
  name: string;
}

export class UpdatedUserNameResponseDTO {
  name: string;
  id: string;
}

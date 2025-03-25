export class GetUserByIdResponseDTO {
  id: string;
  name: string;
  createdAt: Date;
  email: string;
  wallet: {
    id: string;
    balance: number;
  };
}

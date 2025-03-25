export class GetUsersResponseDTO {
  users: {
    id: string;
    name: string;
    email: string;
    wallet: {
      id: string;
      balance: number;
    } | null; // Permite wallet ser null
  }[];
}

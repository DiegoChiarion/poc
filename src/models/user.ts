export class UserModel {
  id: string;
  name: string;
  password: string;
  createdAt: Date;

  constructor(id: string, name: string, password: string, createdAt: Date) {
    this.id = id;
    this.name = name.toUpperCase();
    this.password = password;
    this.createdAt = createdAt;
  }
}

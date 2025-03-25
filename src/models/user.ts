export class UserModel {
  id: string;
  name: string;
  password: string;
  createdAt: Date;
  email: string;

  constructor(
    id: string,
    name: string,
    password: string,
    createdAt: Date,
    email: string,
  ) {
    this.id = id;
    this.name = name.toUpperCase();
    this.password = password;
    this.createdAt = createdAt;
    this.email = email;
  }
}

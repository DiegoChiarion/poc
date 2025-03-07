export class UserModel {
  id: string;
  name: string;
  password: string;

  constructor(id: string, name: string, password: string) {
    this.id = id;
    this.name = name.toUpperCase();
    this.password = password;
  }
}

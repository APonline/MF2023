import { User } from './user';

export interface Query {
  Login: User,
  allUsers: User[],
  User: User[],
  UserRequestPassword: any;
}

import { User } from './user';


export interface Mutation {
  CreateUser: User;
  VerifyUser: User;
  UpdateUser: User;
  DeleteUser: User;
  UploadFiles?: any[];
  UploadFile?: any[];
}

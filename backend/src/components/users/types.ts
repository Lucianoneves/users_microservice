export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface CreateUserResult {
  id: number;
  token: string;
}

import { Injectable } from '@nestjs/common';

interface User {
  userId: number;
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      userId: 1,
      username: 'admin',
      password: 'admin123',
    },
    {
      userId: 2,
      username: 'user',
      password: 'user123',
    },
  ];

  findOne(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }
}

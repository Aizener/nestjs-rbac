import argon2 from 'argon2';
import type { User } from 'generated/prisma/client';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** 按用户名查找（供 Auth 登录校验用，返回含密码） */
  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      select: USER_SELECT,
    });
    return users;
  }

  async findOneById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }
    if (dto.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException('邮箱已被使用');
      }
    }
    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        email: dto.email ?? undefined,
      },
      select: USER_SELECT,
    });
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('用户不存在');
    if (dto.username) {
      const usernameTaken = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (usernameTaken) {
        throw new ConflictException('用户名已存在');
      }
    }
    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (emailTaken) {
        throw new ConflictException('邮箱已被使用');
      }
    }
    const data: { username?: string; password?: string; email?: string } = {
      ...dto,
    };
    if (dto.password) {
      data.password = await argon2.hash(dto.password);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
    return user;
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch {
      throw new NotFoundException('用户不存在');
    }
  }
}

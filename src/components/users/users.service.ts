import bcrypt from 'bcrypt';
import { Repository, Like } from 'typeorm';
import { UserEntity } from '../../entities/UserEntity';
import { createToken } from '../../lib/auth';
import { logger } from '../../lib/logger';
import { CreateUserInput, UpdateUserInput } from '../../schemas/user.schema';
import { CreateUserResult, PublicUser } from './types';

const PUBLIC_FIELDS: (keyof PublicUser)[] = ['id', 'username', 'email', 'role'];

function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export class UsersService {
  constructor(private readonly repo: Repository<UserEntity>) {}

  async create(input: CreateUserInput): Promise<CreateUserResult> {
    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = this.repo.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    });
    const saved = await this.repo.save(user);
    const token = createToken(saved.id, saved.role);

    logger.info('user.created', { userId: saved.id, role: saved.role });
    return { id: saved.id, token };
  }

  async findById(id: number): Promise<PublicUser | null> {
    const user = await this.repo.findOne({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    return user ? toPublicUser(user as UserEntity) : null;
  }

  async update(id: number, input: UpdateUserInput): Promise<boolean> {
    const result = await this.repo.update(id, input);
    if (result.affected && result.affected > 0) {
      logger.info('user.updated', { userId: id });
      return true;
    }
    return false;
  }

  async list(filters: { role?: string; search?: string }): Promise<PublicUser[]> {
    const where: Record<string, unknown> = {};
    if (filters.role) where.role = filters.role;
    if (filters.search) where.username = Like(`%${filters.search}%`);

    const users = await this.repo.find({
      where,
      select: PUBLIC_FIELDS,
    });
    return users.map(toPublicUser);
  }
}

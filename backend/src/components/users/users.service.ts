import bcrypt from 'bcrypt';
import { Repository, Like, MoreThan, Not, IsNull } from 'typeorm';
import { env } from '../../config/env';
import { PasswordResetTokenEntity } from '../../entities/PasswordResetTokenEntity';
import { UserEntity } from '../../entities/UserEntity';
import { createToken } from '../../lib/auth';
import { ConflictError, ForbiddenError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import {
  buildResetLink,
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from '../../lib/passwordReset';
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
  constructor(
    private readonly repo: Repository<UserEntity>,
    private readonly resetTokenRepo: Repository<PasswordResetTokenEntity>,
  ) {}

  async login(email: string, password: string): Promise<CreateUserResult | null> {
    const user = await this.repo.findOne({ where: { email }, withDeleted: true });
    if (!user) return null;

    if (user.deletedAt) {
      logger.info('user.login_blocked_deleted', { userId: user.id });
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return null;

    const token = createToken(user.id, user.role);
    logger.info('user.login', { userId: user.id, role: user.role });
    return { id: user.id, token };
  }

  async create(input: CreateUserInput): Promise<CreateUserResult> {
    const activeByEmail = await this.repo.findOne({ where: { email: input.email } });
    if (activeByEmail) {
      throw new ConflictError('User already exists');
    }

    const activeByUsername = await this.repo.findOne({ where: { username: input.username } });
    if (activeByUsername) {
      throw new ConflictError('User already exists');
    }

    const deletedByEmail = await this.repo.findOne({
      where: { email: input.email },
      withDeleted: true,
    });
    if (deletedByEmail?.deletedAt) {
      return this.reactivateFromRegistration(deletedByEmail, input);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = this.repo.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      role: 'user',
    });
    const saved = await this.repo.save(user);
    const token = createToken(saved.id, saved.role);

    logger.info('user.created', { userId: saved.id, role: saved.role });
    return { id: saved.id, token };
  }

  async reactivate(email: string, password: string): Promise<CreateUserResult | null> {
    const user = await this.repo.findOne({ where: { email }, withDeleted: true });
    if (!user?.deletedAt) return null;

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return null;

    if (user.role === 'admin') {
      await this.assertCanHaveAdmin(user.id);
    }

    await this.repo.restore(user.id);
    const token = createToken(user.id, user.role);
    logger.info('user.reactivated', { userId: user.id, method: 'self_service' });
    return { id: user.id, token };
  }

  async restore(id: number): Promise<boolean> {
    const user = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!user?.deletedAt) return false;

    const activeByEmail = await this.repo.findOne({ where: { email: user.email } });
    if (activeByEmail) {
      throw new ConflictError('Cannot restore: email already in use by another account');
    }

    const activeByUsername = await this.repo.findOne({ where: { username: user.username } });
    if (activeByUsername) {
      throw new ConflictError('Cannot restore: username already in use by another account');
    }

    if (user.role === 'admin') {
      await this.assertCanHaveAdmin(user.id);
    }

    await this.repo.restore(id);
    logger.info('user.restored', { userId: id });
    return true;
  }

  async findById(id: number): Promise<PublicUser | null> {
    const user = await this.repo.findOne({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    return user ? toPublicUser(user as UserEntity) : null;
  }

  async update(id: number, input: UpdateUserInput): Promise<boolean> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) return false;

    if (input.role !== undefined) {
      await this.validateRoleChange(id, input.role);
    }

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

  async listDeleted(): Promise<PublicUser[]> {
    const users = await this.repo.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      select: PUBLIC_FIELDS,
    });
    return users.map(toPublicUser);
  }

  async softDelete(id: number): Promise<boolean> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) return false;

    const result = await this.repo.softDelete(id);
    if (result.affected && result.affected > 0) {
      logger.info('user.deleted', { userId: id });
      return true;
    }
    return false;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repo.findOne({ where: { email } });
    if (!user) {
      logger.info('password_reset.requested', { email, userFound: false });
      return;
    }

    await this.resetTokenRepo.delete({ userId: user.id });

    const { token, tokenHash } = generateResetToken();
    const resetToken = this.resetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt: getResetTokenExpiry(),
    });
    await this.resetTokenRepo.save(resetToken);

    logger.info('password_reset.requested', { userId: user.id, userFound: true });

    if (env.NODE_ENV !== 'production') {
      logger.info('password_reset.dev_link', {
        userId: user.id,
        resetLink: buildResetLink(token),
      });
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenHash = hashResetToken(token);
    const now = new Date();

    const resetToken = await this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        expiresAt: MoreThan(now),
      },
    });

    if (!resetToken) {
      logger.info('password_reset.failed', { reason: 'invalid_or_expired_token' });
      return false;
    }

    const user = await this.repo.findOne({ where: { id: resetToken.userId } });
    if (!user) {
      logger.info('password_reset.failed', { reason: 'user_deleted_or_missing' });
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.repo.update(resetToken.userId, { password: hashedPassword });
    await this.resetTokenRepo.delete({ userId: resetToken.userId });

    logger.info('password_reset.completed', { userId: resetToken.userId });
    return true;
  }

  private async findActiveAdmin(): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { role: 'admin' } });
  }

  private async assertCanHaveAdmin(allowedUserId: number): Promise<void> {
    const admin = await this.findActiveAdmin();
    if (admin && admin.id !== allowedUserId) {
      throw new ForbiddenError('Only one administrator is allowed');
    }
  }

  private async validateRoleChange(userId: number, newRole: string): Promise<void> {
    if (newRole === 'admin') {
      await this.assertCanHaveAdmin(userId);
      return;
    }

    const user = await this.repo.findOne({ where: { id: userId } });
    if (user?.role === 'admin' && newRole !== 'admin') {
      throw new ForbiddenError('The administrator role cannot be removed');
    }
  }

  private async reactivateFromRegistration(
    deletedUser: UserEntity,
    input: CreateUserInput,
  ): Promise<CreateUserResult> {
    if (input.username !== deletedUser.username) {
      const usernameTaken = await this.repo.findOne({ where: { username: input.username } });
      if (usernameTaken) {
        throw new ConflictError('Username already in use');
      }
    }

    const role = deletedUser.role === 'admin' ? 'admin' : 'user';
    if (role === 'admin') {
      await this.assertCanHaveAdmin(deletedUser.id);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    await this.repo.restore(deletedUser.id);
    await this.repo.update(deletedUser.id, {
      username: input.username,
      password: hashedPassword,
      role,
    });

    const token = createToken(deletedUser.id, role);
    logger.info('user.reactivated', { userId: deletedUser.id, method: 'registration' });
    return { id: deletedUser.id, token };
  }
}

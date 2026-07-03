import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UsersService } from '../src/components/users/users.service';
import { PasswordResetTokenEntity } from '../src/entities/PasswordResetTokenEntity';
import { UserEntity } from '../src/entities/UserEntity';
import { ConflictError, ForbiddenError } from '../src/lib/errors';

function createMockRepo<T extends object>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('UsersService soft delete', () => {
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let resetTokenRepo: jest.Mocked<Repository<PasswordResetTokenEntity>>;
  let service: UsersService;

  beforeEach(() => {
    userRepo = createMockRepo<UserEntity>();
    resetTokenRepo = createMockRepo<PasswordResetTokenEntity>();
    service = new UsersService(userRepo, resetTokenRepo);
  });

  it('login blocks soft-deleted users', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      email: 'deleted@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      deletedAt: new Date(),
    } as UserEntity);

    const result = await service.login('deleted@example.com', 'password123');

    expect(result).toBeNull();
  });

  it('reactivate restores a deleted user with valid password', async () => {
    const hashed = await bcrypt.hash('password123', 12);
    userRepo.findOne.mockResolvedValue({
      id: 5,
      email: 'user@example.com',
      password: hashed,
      role: 'user',
      deletedAt: new Date(),
    } as UserEntity);
    userRepo.restore.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

    const result = await service.reactivate('user@example.com', 'password123');

    expect(result).toEqual({ id: 5, token: expect.any(String) });
    expect(userRepo.restore).toHaveBeenCalledWith(5);
  });

  it('reactivate returns null for active users', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 5,
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      deletedAt: null,
    } as UserEntity);

    const result = await service.reactivate('user@example.com', 'password123');

    expect(result).toBeNull();
    expect(userRepo.restore).not.toHaveBeenCalled();
  });

  it('restore reactivates a deleted user for admin', async () => {
    userRepo.findOne
      .mockResolvedValueOnce({
        id: 3,
        email: 'old@example.com',
        username: 'old_user',
        deletedAt: new Date(),
      } as UserEntity)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    userRepo.restore.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

    const result = await service.restore(3);

    expect(result).toBe(true);
    expect(userRepo.restore).toHaveBeenCalledWith(3);
  });

  it('create reactivates when email belongs to a deleted account', async () => {
    userRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 9,
        email: 'returning@example.com',
        username: 'returning',
        deletedAt: new Date(),
      } as UserEntity);
    userRepo.restore.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    userRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

    const result = await service.create({
      username: 'returning',
      email: 'returning@example.com',
      password: 'newpassword123',
    });

    expect(result).toEqual({ id: 9, token: expect.any(String) });
    expect(userRepo.restore).toHaveBeenCalledWith(9);
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('create throws ConflictError when email is already active', async () => {
    userRepo.findOne.mockResolvedValueOnce({
      id: 1,
      email: 'taken@example.com',
    } as UserEntity);

    await expect(
      service.create({
        username: 'new_user',
        email: 'taken@example.com',
        password: 'password12345',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('softDelete only affects active users', async () => {
    userRepo.findOne.mockResolvedValue(null);

    const result = await service.softDelete(99);

    expect(result).toBe(false);
    expect(userRepo.softDelete).not.toHaveBeenCalled();
  });

  it('listDeleted returns only soft-deleted users', async () => {
    userRepo.find.mockResolvedValue([
      { id: 2, username: 'gone', email: 'gone@example.com', role: 'user' },
    ] as UserEntity[]);

    const users = await service.listDeleted();

    expect(users).toHaveLength(1);
    expect(userRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
  });
});

describe('UsersService single admin policy', () => {
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let resetTokenRepo: jest.Mocked<Repository<PasswordResetTokenEntity>>;
  let service: UsersService;

  beforeEach(() => {
    userRepo = createMockRepo<UserEntity>();
    resetTokenRepo = createMockRepo<PasswordResetTokenEntity>();
    service = new UsersService(userRepo, resetTokenRepo);
  });

  it('create always registers users with role user', async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockImplementation((data) => data as UserEntity);
    userRepo.save.mockResolvedValue({
      id: 10,
      username: 'newbie',
      email: 'newbie@example.com',
      role: 'user',
    } as UserEntity);

    const result = await service.create({
      username: 'newbie',
      email: 'newbie@example.com',
      password: 'password12345',
    });

    expect(result.id).toBe(10);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user' }),
    );
  });

  it('update rejects promoting a user when an admin already exists', async () => {
    userRepo.findOne
      .mockResolvedValueOnce({ id: 2, role: 'user' } as UserEntity)
      .mockResolvedValueOnce({ id: 1, role: 'admin' } as UserEntity);

    await expect(service.update(2, { role: 'admin' })).rejects.toBeInstanceOf(ForbiddenError);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('update rejects demoting the administrator', async () => {
    userRepo.findOne.mockResolvedValue({ id: 1, role: 'admin' } as UserEntity);

    await expect(service.update(1, { role: 'user' })).rejects.toBeInstanceOf(ForbiddenError);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});

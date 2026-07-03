import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UsersService } from '../src/components/users/users.service';
import { PasswordResetTokenEntity } from '../src/entities/PasswordResetTokenEntity';
import { UserEntity } from '../src/entities/UserEntity';
import { generateResetToken } from '../src/lib/passwordReset';

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

describe('UsersService password reset', () => {
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let resetTokenRepo: jest.Mocked<Repository<PasswordResetTokenEntity>>;
  let service: UsersService;

  beforeEach(() => {
    userRepo = createMockRepo<UserEntity>();
    resetTokenRepo = createMockRepo<PasswordResetTokenEntity>();
    service = new UsersService(userRepo, resetTokenRepo);
  });

  it('requestPasswordReset does nothing when user is not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await service.requestPasswordReset('missing@example.com');

    expect(resetTokenRepo.delete).not.toHaveBeenCalled();
    expect(resetTokenRepo.save).not.toHaveBeenCalled();
  });

  it('requestPasswordReset creates a token for an existing user', async () => {
    userRepo.findOne.mockResolvedValue({ id: 7, email: 'user@example.com' } as UserEntity);
    resetTokenRepo.create.mockImplementation((data) => data as PasswordResetTokenEntity);
    resetTokenRepo.save.mockResolvedValue({} as PasswordResetTokenEntity);

    await service.requestPasswordReset('user@example.com');

    expect(resetTokenRepo.delete).toHaveBeenCalledWith({ userId: 7 });
    expect(resetTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(resetTokenRepo.save).toHaveBeenCalled();
  });

  it('resetPassword updates password and invalidates token', async () => {
    const { token, tokenHash } = generateResetToken();
    resetTokenRepo.findOne.mockResolvedValue({
      id: 1,
      userId: 42,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    } as PasswordResetTokenEntity);
    userRepo.findOne.mockResolvedValue({ id: 42 } as UserEntity);
    userRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

    const result = await service.resetPassword(token, 'newpassword123');

    expect(result).toBe(true);
    expect(userRepo.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        password: expect.any(String),
      }),
    );
    const updatedPassword = userRepo.update.mock.calls[0][1]?.password as string;
    expect(await bcrypt.compare('newpassword123', updatedPassword)).toBe(true);
    expect(resetTokenRepo.delete).toHaveBeenCalledWith({ userId: 42 });
  });

  it('resetPassword returns false for invalid token', async () => {
    resetTokenRepo.findOne.mockResolvedValue(null);

    const result = await service.resetPassword('invalid-token', 'newpassword123');

    expect(result).toBe(false);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});

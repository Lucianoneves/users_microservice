import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteAndTimestamps1730500000000 implements MigrationInterface {
  name = 'AddSoftDeleteAndTimestamps1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "createdAt"`);
  }
}

import {MigrationInterface, QueryRunner} from "typeorm";

export class initial1589317286286 implements MigrationInterface {
    name = 'initial1589317286286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "video_subtitle" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "path" varchar NOT NULL, "videoItemId" integer)`, undefined);
        await queryRunner.query(`CREATE TABLE "video_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "path" varchar NOT NULL)`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_video_subtitle" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "path" varchar NOT NULL, "videoItemId" integer, CONSTRAINT "FK_6af5ad3a8d6baf1dd76d5c11a28" FOREIGN KEY ("videoItemId") REFERENCES "video_item" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_video_subtitle"("id", "name", "path", "videoItemId") SELECT "id", "name", "path", "videoItemId" FROM "video_subtitle"`, undefined);
        await queryRunner.query(`DROP TABLE "video_subtitle"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_video_subtitle" RENAME TO "video_subtitle"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_subtitle" RENAME TO "temporary_video_subtitle"`, undefined);
        await queryRunner.query(`CREATE TABLE "video_subtitle" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "path" varchar NOT NULL, "videoItemId" integer)`, undefined);
        await queryRunner.query(`INSERT INTO "video_subtitle"("id", "name", "path", "videoItemId") SELECT "id", "name", "path", "videoItemId" FROM "temporary_video_subtitle"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_video_subtitle"`, undefined);
        await queryRunner.query(`DROP TABLE "video_item"`, undefined);
        await queryRunner.query(`DROP TABLE "video_subtitle"`, undefined);
    }

}

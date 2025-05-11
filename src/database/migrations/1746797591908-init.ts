import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1746797591908 implements MigrationInterface {
    name = 'Init1746797591908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "core"`);
        await queryRunner.query(`CREATE TABLE "core"."users" ("create_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "update_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "delete_dt" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "full_name" character varying, "phone_number" character varying, "telegram_id" bigint NOT NULL, "telegram_username" character varying, CONSTRAINT "UQ_1a1e4649fd31ea6ec6b025c7bfc" UNIQUE ("telegram_id"), CONSTRAINT "pk_core_users_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a1e4649fd31ea6ec6b025c7bf" ON "core"."users" ("telegram_id") `);
        await queryRunner.query(`CREATE TABLE "core"."appointments" ("create_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "update_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "delete_dt" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "telegram_id" bigint NOT NULL, "location_id" integer NOT NULL, "start_dt" TIMESTAMP WITH TIME ZONE NOT NULL, "end_dt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "pk_core_appointments_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "core"."locations" ("create_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "update_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "delete_dt" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "code" character varying(255) NOT NULL, CONSTRAINT "uq_core_locations_code" UNIQUE ("code"), CONSTRAINT "pk_core_locations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "core"."enum_language_code" AS ENUM('eng', 'ru')`);
        await queryRunner.query(`CREATE TABLE "core"."location_translations" ("create_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "update_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "delete_dt" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "location_id" integer NOT NULL, "language_code" "core"."enum_language_code" NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "uq_core_location_translations_location_id_language_code" UNIQUE ("location_id", "language_code"), CONSTRAINT "pk_core_location_translations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "core"."appointments" ADD CONSTRAINT "fk_core_appointments_core_users_telegram_id" FOREIGN KEY ("telegram_id") REFERENCES "core"."users"("telegram_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."appointments" ADD CONSTRAINT "fk_core_appointments_core_locations_location_id" FOREIGN KEY ("location_id") REFERENCES "core"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."location_translations" ADD CONSTRAINT "FK_1fe3a040997b6aff0d7e0324007" FOREIGN KEY ("location_id") REFERENCES "core"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."location_translations" DROP CONSTRAINT "FK_1fe3a040997b6aff0d7e0324007"`);
        await queryRunner.query(`ALTER TABLE "core"."appointments" DROP CONSTRAINT "fk_core_appointments_core_locations_location_id"`);
        await queryRunner.query(`ALTER TABLE "core"."appointments" DROP CONSTRAINT "fk_core_appointments_core_users_telegram_id"`);
        await queryRunner.query(`DROP TABLE "core"."location_translations"`);
        await queryRunner.query(`DROP TYPE "core"."enum_language_code"`);
        await queryRunner.query(`DROP TABLE "core"."locations"`);
        await queryRunner.query(`DROP TABLE "core"."appointments"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_1a1e4649fd31ea6ec6b025c7bf"`);
        await queryRunner.query(`DROP TABLE "core"."users"`);
    }

}

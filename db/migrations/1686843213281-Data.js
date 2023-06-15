module.exports = class Data1686843213281 {
    name = 'Data1686843213281'

    async up(db) {
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "token_id" numeric NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_b27b1150b8a7af68424540613c" ON "transfer" ("token_id") `)
        await db.query(`CREATE INDEX "IDX_be54ea276e0f665ffc38630fc0" ON "transfer" ("from") `)
        await db.query(`CREATE INDEX "IDX_4cbc37e8c3b47ded161f44c24f" ON "transfer" ("to") `)
        await db.query(`CREATE INDEX "IDX_f605a03972b4f28db27a0ee70d" ON "transfer" ("tx_hash") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP INDEX "public"."IDX_b27b1150b8a7af68424540613c"`)
        await db.query(`DROP INDEX "public"."IDX_be54ea276e0f665ffc38630fc0"`)
        await db.query(`DROP INDEX "public"."IDX_4cbc37e8c3b47ded161f44c24f"`)
        await db.query(`DROP INDEX "public"."IDX_f605a03972b4f28db27a0ee70d"`)
    }
}

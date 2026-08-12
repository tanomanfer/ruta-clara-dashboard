ALTER TABLE "public"."leads"
    ADD COLUMN "mail_enviado" boolean DEFAULT false NOT NULL;


UPDATE "public"."leads" SET "mail_enviado" = false;

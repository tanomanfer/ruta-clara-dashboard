CREATE TYPE "public"."motivo_zona" AS ENUM (
    'inseguridad',
    'calle_rota',
    'otro'
);


ALTER TYPE "public"."motivo_zona" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zonas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "motivo" "public"."motivo_zona" NOT NULL,
    "nota" "text",
    "compartido" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."zonas" OWNER TO "postgres";


COMMENT ON TABLE "public"."zonas" IS 'Zonas de riesgo o problema marcadas por los choferes';



COMMENT ON COLUMN "public"."zonas"."motivo" IS 'Motivo por el cual se marcó la zona: inseguridad, calle rota u otro';



COMMENT ON COLUMN "public"."zonas"."nota" IS 'Aclaración opcional que agrega el chofer sobre la zona';



COMMENT ON COLUMN "public"."zonas"."compartido" IS 'Si es true, la zona es visible para otros choferes además del creador';



ALTER TABLE ONLY "public"."zonas"
    ADD CONSTRAINT "zonas_pkey" PRIMARY KEY ("id");



CREATE INDEX "zonas_user_id_idx" ON "public"."zonas" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."zonas"
    ADD CONSTRAINT "zonas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "El chofer puede actualizar sus propias zonas" ON "public"."zonas" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede borrar sus propias zonas" ON "public"."zonas" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede crear sus propias zonas" ON "public"."zonas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede ver sus propias zonas o las compartidas" ON "public"."zonas" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("compartido" = true)));



ALTER TABLE "public"."zonas" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON TABLE "public"."zonas" TO "anon";
GRANT ALL ON TABLE "public"."zonas" TO "authenticated";
GRANT ALL ON TABLE "public"."zonas" TO "service_role";

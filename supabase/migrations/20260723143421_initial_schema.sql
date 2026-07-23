


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."decision_chofer" AS ENUM (
    'aceptado',
    'rechazado'
);


ALTER TYPE "public"."decision_chofer" OWNER TO "postgres";


CREATE TYPE "public"."estado_semaforo" AS ENUM (
    'verde',
    'amarillo',
    'rojo'
);


ALTER TYPE "public"."estado_semaforo" OWNER TO "postgres";


CREATE TYPE "public"."plataforma_viaje" AS ENUM (
    'uber',
    'didi'
);


ALTER TYPE "public"."plataforma_viaje" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."actualizar_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_perfil_nuevo_usuario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.perfiles (id, objetivo_km, objetivo_hora)
  values (new.id, 0, 0);
  return new;
end;
$$;


ALTER FUNCTION "public"."crear_perfil_nuevo_usuario"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."perfiles" (
    "id" "uuid" NOT NULL,
    "objetivo_km" numeric(10,2) DEFAULT 0 NOT NULL,
    "objetivo_hora" numeric(10,2) DEFAULT 0 NOT NULL,
    "nombre" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."perfiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."perfiles" IS 'Configuración de objetivos de rentabilidad por chofer';



COMMENT ON COLUMN "public"."perfiles"."objetivo_km" IS 'Ganancia mínima deseada por kilómetro, en pesos argentinos';



COMMENT ON COLUMN "public"."perfiles"."objetivo_hora" IS 'Ganancia mínima deseada por hora, en pesos argentinos';



CREATE TABLE IF NOT EXISTS "public"."viajes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plataforma" "public"."plataforma_viaje" NOT NULL,
    "tarifa" numeric(10,2) NOT NULL,
    "distancia_km" numeric(10,2) NOT NULL,
    "tiempo_estimado_min" numeric(10,2),
    "rentabilidad_km" numeric(10,2) NOT NULL,
    "rentabilidad_hora" numeric(10,2),
    "estado" "public"."estado_semaforo" NOT NULL,
    "decision" "public"."decision_chofer",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."viajes" OWNER TO "postgres";


COMMENT ON TABLE "public"."viajes" IS 'Historial de viajes detectados y su cálculo de rentabilidad';



COMMENT ON COLUMN "public"."viajes"."rentabilidad_km" IS 'Ganancia calculada por kilómetro para este viaje puntual';



COMMENT ON COLUMN "public"."viajes"."estado" IS 'Resultado del semáforo según los objetivos configurados por el chofer';



COMMENT ON COLUMN "public"."viajes"."decision" IS 'Si el chofer aceptó o rechazó el viaje en la app original (Uber/DiDi). Puede quedar null si no se registró la decisión';



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viajes"
    ADD CONSTRAINT "viajes_pkey" PRIMARY KEY ("id");



CREATE INDEX "viajes_user_id_created_at_idx" ON "public"."viajes" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "perfiles_updated_at" BEFORE UPDATE ON "public"."perfiles" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_updated_at"();



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viajes"
    ADD CONSTRAINT "viajes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "El chofer puede actualizar su propio perfil" ON "public"."perfiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "El chofer puede actualizar sus propios viajes" ON "public"."viajes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede borrar sus propios viajes" ON "public"."viajes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede crear su propio perfil" ON "public"."perfiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "El chofer puede registrar sus propios viajes" ON "public"."viajes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "El chofer puede ver su propio perfil" ON "public"."perfiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "El chofer puede ver sus propios viajes" ON "public"."viajes" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viajes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."actualizar_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."crear_perfil_nuevo_usuario"() TO "anon";
GRANT ALL ON FUNCTION "public"."crear_perfil_nuevo_usuario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."crear_perfil_nuevo_usuario"() TO "service_role";



GRANT ALL ON TABLE "public"."perfiles" TO "anon";
GRANT ALL ON TABLE "public"."perfiles" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles" TO "service_role";



GRANT ALL ON TABLE "public"."viajes" TO "anon";
GRANT ALL ON TABLE "public"."viajes" TO "authenticated";
GRANT ALL ON TABLE "public"."viajes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








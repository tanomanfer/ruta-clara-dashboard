CREATE OR REPLACE FUNCTION "public"."leads_count"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*) from public.leads;
$$;


ALTER FUNCTION "public"."leads_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."leads_count"() IS 'Cantidad total de leads, expuesta para el contador público de la landing (no expone filas individuales)';


GRANT EXECUTE ON FUNCTION "public"."leads_count"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."leads_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."leads_count"() TO "service_role";

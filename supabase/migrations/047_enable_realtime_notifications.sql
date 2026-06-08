-- ============================================================
-- 047: Enable Realtime for notifications on reservations & product_queries
-- ============================================================
-- Habilita Realtime en las tablas necesarias para que el panel
-- admin reciba notificaciones en vivo cuando un cliente crea
-- una reserva o consulta desde la tienda.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['reservations', 'product_queries'];
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add each table if not already in publication
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.%I', tbl);
    END IF;
  END LOOP;
END;
$$;

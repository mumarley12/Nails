-- Só há uma pessoa a atender (a Matilde). O horário passa a ser só o do salão (O Meu Site › Horário);
-- a ficha interna fica aberta 24h/7 dias para não cortar horas. Técnicas a mais sem marcações saem.
DO $$
DECLARE owner_id text;
BEGIN
  SELECT id INTO owner_id FROM staff WHERE active ORDER BY sort_order, created_at LIMIT 1;
  IF owner_id IS NULL THEN
    SELECT id INTO owner_id FROM staff ORDER BY sort_order, created_at LIMIT 1;
  END IF;
  IF owner_id IS NULL THEN
    owner_id := gen_random_uuid()::text;
    INSERT INTO staff (id, name, role) VALUES (owner_id, 'Matilde', 'Nail designer');
  END IF;

  UPDATE blocked_times SET staff_id = NULL WHERE staff_id IS NOT NULL;
  UPDATE staff SET active = true, work_days = ARRAY[0,1,2,3,4,5,6], start_min = 0, end_min = 1440, absence_note = NULL WHERE id = owner_id;
  UPDATE staff SET active = false WHERE id <> owner_id;
  DELETE FROM service_staff WHERE staff_id <> owner_id;
  DELETE FROM staff WHERE id <> owner_id AND id NOT IN (SELECT staff_id FROM appointments);
  INSERT INTO service_staff (service_id, staff_id) SELECT id, owner_id FROM services ON CONFLICT DO NOTHING;
END $$;

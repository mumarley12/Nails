-- Passa os dados de exemplo "Polish & Glow" para os dados reais da Luxe Nails (só se ainda forem os de exemplo).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM site_settings WHERE id = 1 AND salon_name = 'Polish & Glow') THEN
    UPDATE site_settings SET salon_name = 'Luxe Nails by MVN', address = '', postal_code = '', city = 'Agualva-Cacém',
      phone = '937 142 531', whatsapp = '937 142 531', email = '', instagram = '@luxenailsbymvn', tiktok = '@luxenailsbymvn',
      hero_title = 'Detalhe', hero_title_accent = 'é tudo.',
      hero_subtitle = 'Francesinha, leitosos, dourados e flores 3D — feitos por mim, um par de mãos de cada vez.',
      about_text = '', promo_active = false, hero_photo_url = '/fotos/luxe-05.jpg', about_photo_url = '/fotos/luxe-07.jpg'
    WHERE id = 1;

    -- Opiniões de exemplo não são reais: saem. As verdadeiras põem-se no painel.
    DELETE FROM reviews;

    IF NOT EXISTS (SELECT 1 FROM appointments) THEN
      DELETE FROM service_staff;
      DELETE FROM services;
      DELETE FROM staff WHERE id NOT IN (SELECT id FROM staff ORDER BY sort_order, created_at LIMIT 1);
      IF NOT EXISTS (SELECT 1 FROM staff) THEN
        INSERT INTO staff (id, name, role) VALUES (gen_random_uuid()::text, 'Matilde', 'Nail designer');
      END IF;
      UPDATE staff SET name = 'Matilde', role = 'Nail designer', tags = ARRAY['Gel','Francesinha','Nail art','Pés'],
        work_days = ARRAY[1,2,3,4,5,6], start_min = 540, end_min = 1140, active = true;
      INSERT INTO services (id, name, description, category, price_cents, duration_min, is_add_on, sort_order) VALUES
        (gen_random_uuid()::text, 'Gelinho', 'Verniz gel na unha natural', 'Mãos', 0, 60, false, 1),
        (gen_random_uuid()::text, 'Extensão em gel', 'Comprimento e formato à escolha', 'Mãos', 0, 120, false, 2),
        (gen_random_uuid()::text, 'Manutenção', '3 a 4 semanas depois da extensão', 'Mãos', 0, 90, false, 3),
        (gen_random_uuid()::text, 'Pés em gel', 'Cutículas e verniz gel', 'Pés', 0, 60, false, 4),
        (gen_random_uuid()::text, 'Nail art', 'Francesinha, flores 3D, dourados, desenhos', 'Extra', 0, 20, true, 5);
      INSERT INTO service_staff (service_id, staff_id) SELECT s.id, st.id FROM services s CROSS JOIN staff st;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM gallery_photos) THEN
      INSERT INTO gallery_photos (id, url, label, alt, sort_order)
      SELECT gen_random_uuid()::text, '/fotos/luxe-' || n || '.jpg', '', 'Unhas feitas pela Matilde', i
      FROM unnest(ARRAY['01','09','04','05','12','02','11','06','10','03','08','07']) WITH ORDINALITY AS t(n, i);
    END IF;
  END IF;
END $$;

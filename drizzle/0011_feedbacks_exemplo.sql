-- 3 cartões de EXEMPLO (claramente provisórios) para a secção Feedbacks não ficar vazia.
-- Só entram se ainda não houver nenhum feedback. A Matilde apaga-os no painel quando tiver feedbacks reais.
INSERT INTO "reviews" ("id", "name", "city", "text", "rating", "date", "visible")
SELECT gen_random_uuid()::text, v.name, '', v.text, 5, now() - v.ago, true
FROM (VALUES
  ('Exemplo', 'Este é um cartão de exemplo. Aqui vai aparecer o feedback de uma cliente.', interval '0 days'),
  ('Exemplo', 'Cartão de exemplo: os feedbacks reais entram pelo botão «Deixar feedback».', interval '3 days'),
  ('Exemplo', 'Cartão de exemplo: a Matilde apaga-o no painel quando tiver feedbacks verdadeiros.', interval '9 days')
) AS v(name, text, ago)
WHERE NOT EXISTS (SELECT 1 FROM "reviews");

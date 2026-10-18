export const templates=[
  ['purchase-confirmation','Potvrdenie nákupu','transactional','Ďakujeme za objednávku {{order_id}}. Zakúpené produkty: {{products}}.'],
  ['portal-access','Prístup do rodičovského portálu','transactional','Prístupový odkaz: {{secure_portal_link}}. Odkaz môže vzniknúť až po zapojení bezpečného prihlasovania.'],
  ['completed','Ďakujeme za spoločné dobrodružstvo','transactional','Váš tím dokončil {{episode_name}}. Ďakujeme za pomoc Pixelkom.'],
  ['congratulations','Gratulujeme vášmu tímu','transactional','Výborne, {{team_name}}! Spoločne ste vyriešili celý prípad.'],
  ['diploma','Diplom pre záchranný tím','transactional','Váš personalizovaný diplom: {{secure_diploma_link}}.'],
  ['next-episode','Ďalšia epizóda','marketing','Nové dobrodružstvo: {{product_link}}. Odhlásenie: {{unsubscribe_link}}.'],
  ['bonus-mission','Bonusové misie','marketing','Objavte pripravené misie: {{product_link}}. Odhlásenie: {{unsubscribe_link}}.'],
  ['unfinished-reminder','Pripomenutie nedokončenej hry','marketing','Ak máte chuť pokračovať, vaša výprava čaká: {{secure_portal_link}}. Odhlásenie: {{unsubscribe_link}}.']
].map(([id,subject,category,body])=>({id,subject,category,body,status:'draft',sendingEnabled:false}));

# Trvalé uloženie konfigurácie a kľúčov

Kontrola 12. 11. 2026 porovnala názvy produkčných Worker bindings, repository Codespaces secrets a prítomnosť premenných v aktuálnom prostredí. Tajné hodnoty neboli vypísané; kontrola názvov nepotvrdzuje rovnosť hodnôt medzi úložiskami.

## Kde konfigurácia pretrváva

- **Cloudflare:** produkčné secrets patria existujúcemu Workeru `treasurequest-admin`. Zastavenie, prestavanie ani zmazanie Codespace ich neodstráni. Existujúci Worker zachovať vrátane administrátorských secrets.
- **GitHub:** repository Codespaces secrets patria repozitáru `romanduris/Pixelkovia`, nie jednotlivému Codespace. Sú určené aj ďalším oprávneným Codespaces tohto repozitára. Po doplnení secretu už otvorené prostredie môže vyžadovať zastavenie a opätovné spustenie.
- **Git:** bežné produkčné premenné sú vo `vars` v `admin/wrangler.production.jsonc`; Cloudflare account, Pages projekt a D1 binding sú v existujúcej konfigurácii. Hodnoty tajných kľúčov do Gitu nepatria.

Dokumentácia: [GitHub repository Codespaces secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization), [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Overený inventár

| Názov | Cloudflare produkcia | GitHub repository Codespaces secret |
| --- | --- | --- |
| `PIXELKOVIA_TOKEN` | Kľúč nasadzovacieho nástroja, nepatrí do runtime Workera | Áno |
| `CUSTOMER_AUTH_SECRET` | Áno | Áno |
| `STRIPE_SECRET_KEY` | Áno | Áno |
| `STRIPE_PUBLISHABLE_KEY` | Áno | Áno |
| `STRIPE_WEBHOOK_SECRET` | Áno | Áno |
| `RESEND_API_KEY` | Áno | Áno |
| `RESEND_WEBHOOK_SECRET` | Áno | Áno |
| `SUPPORT_FORWARD_TO` | Áno | Áno |
| `MAIL_DOMAIN_VERIFIED` | Áno | Áno, doplnené 12. 11. |
| `PAYMENTS_ENABLED` | Áno | Áno, doplnené 12. 11. |
| `META_ADS_ACCESS_TOKEN` | Áno, doplnené vlastníkom 12. 11. | **Zatiaľ chýba** |
| `ADMIN_PASSWORD_PEPPER` | Áno | **Chýba kópia pre obnovu** |
| `ADMIN_PASSWORD_RECORD` | Áno | **Chýba kópia pre obnovu** |

Všetkých päť produkčných textových premenných (`ADMIN_AUTH_MODE`, `DEMO_MODE`, `ENVIRONMENT`, `MARKETING_COLLECTION_ENABLED`, `WEB_URL`) sa pri kontrole zhodovalo s verziovanou konfiguráciou. Oba doplnené prevádzkové príznaky majú hodnotu `true`; tá bola overená cez produkčný `GET /api/checkout/config` s `enabled=true` a podmienky `commerceReady` v nasadenom kóde. Produkčné nastavenia sa pri tejto kontrole nemenili.

GitHub Actions secrets a variables sú iné úložisko. Pokus o ich čítanie v aktuálnom prostredí vrátil HTTP 403 `Resource not accessible by integration`; ich obsah nie je touto kontrolou potvrdený. Na obnovu sú tu overené repository **Codespaces** secrets. Automaticky vydávané `GITHUB_TOKEN` a `GITHUB_CODESPACE_TOKEN` sa nezálohujú ako projektové credentials.

## Zostávajúce doplnenie

- Pôvodný Meta token vložiť priamo do [repository Codespaces secrets](https://github.com/romanduris/Pixelkovia/settings/secrets/codespaces) ako `META_ADS_ACCESS_TOKEN`. Rovnaký názov v Cloudflare sa do GitHubu nesynchronizuje automaticky. Hodnota nie je v aktuálnom prostredí; Cloudflare secrets API vracia iba názvy, nie uložený token.
- Administrátorský pepper a heslový záznam zostávajú zachované v produkčnom Workeri. Ak vlastník má ich pôvodnú bezpečnú kópiu, doplniť rovnaké hodnoty do repository Codespaces secrets. Nevytvárať náhrady ani neotáčať heslo len kvôli zálohe. Bez pôvodných hodnôt nemáme potvrdenú obnovu rovnakého prihlásenia do úplne nového Workera; nasadenia na existujúci Worker ich zachovávajú.
- Po uložení Meta tokenu overiť jeho prítomnosť v zozname GitHub secrets. Jeho platnosť, účet a živý import overiť podľa [Meta checklistu](../MD/DOKONCIT-meta-ads-a-purchase.md).

Názvy možno skontrolovať bez zobrazenia hodnôt:

```sh
gh secret list --app codespaces --repo romanduris/Pixelkovia
```

Pri rotácii credentials aktualizovať produkciu aj trvalú GitHub kópiu. Lokálny `.env`, dočasný súbor alebo samotný `export` v termináli nestačí na obnovu ďalšieho Codespace.

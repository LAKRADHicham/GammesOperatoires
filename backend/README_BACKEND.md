# Backend Gammes Opératoires

## 1. Installation Windows / PowerShell
```powershell
cd backend_gammes_complet
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Créer ensuite une base PostgreSQL nommée `gammes_maintenance`, puis adapter `.env`.

## 2. Initialisation
```powershell
python manage.py makemigrations gammes_maintenance
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 3. JWT
- POST `/api/auth/token/` avec `{ "username": "...", "password": "..." }`
- POST `/api/auth/token/refresh/`
- GET `/api/auth/me/`

Dans React : `Authorization: Bearer <access_token>`.

## 4. Endpoints principaux
- `/api/dashboard/`
- `/api/equipements/`
- `/api/gammes/`
- `/api/versions/`
- `/api/epis/`, `/api/risques/`, `/api/outillages/`, `/api/pieces/`
- `/api/etapes/`, `/api/actions/`
- associations : `/api/version-epis/`, `/api/version-risques/`, `/api/version-outillages/`, `/api/version-pieces/`

Actions version :
- POST `/api/versions/{id}/submit/`
- POST `/api/versions/{id}/validate_version/`
- POST `/api/versions/{id}/clone/`
- POST `/api/versions/{id}/recalculate/`
- POST `/api/versions/{id}/export_pdf/`
- POST `/api/versions/{id}/export_word/`

QR public : GET `/api/qr/{CODE_GAMME}/`

## 5. Rôles
Le profil utilisateur possède : `admin`, `redacteur`, `valideur`, `technicien`.
Le superuser est traité comme administrateur.

## 6. Règle de versioning
- V0 est créée automatiquement lors de la création d'une gamme.
- Une version validée ou archivée est verrouillée.
- `clone` crée V(n+1) avec les associations et les étapes/actions recopiées.
- `validate_version` archive l'ancienne version active et valide la nouvelle.

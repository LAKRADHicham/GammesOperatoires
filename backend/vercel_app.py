"""Point d'entrée WSGI explicite utilisé par Vercel Services.

Vercel attend qu'un service Python expose une variable ``app`` contenant
l'application WSGI/ASGI. Django expose normalement cette application sous le
nom ``application`` dans ``config.wsgi``. Ce module crée simplement l'alias
attendu sans dupliquer la configuration Django.
"""

from config.wsgi import application

# Vercel Python Runtime recherche une variable `app` dans l'entrypoint.
# Elle pointe vers l'application WSGI Django déjà configurée dans config/wsgi.py.
app = application

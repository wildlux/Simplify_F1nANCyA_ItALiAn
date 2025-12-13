#!/bin/bash
# Script per avviare il backend con Gunicorn

echo "🔧 Avvio backend con Gunicorn..."

# Uccidi eventuali processi esistenti
pkill -9 -f "gunicorn" 2>/dev/null
pkill -9 -f "app_wsgi" 2>/dev/null

# Avvia con Gunicorn
cd ~/Desktop/Assistente_Finanziario_AI/assistente-ai-completo/backend/

gunicorn -w 4 -b 0.0.0.0:54321 app_wsgi:application --access-logfile ../logs/gunicorn_access.log --error-logfile ../logs/gunicorn_error.log --daemon

echo "✅ Backend avviato con Gunicorn (porta 54321)"
echo "📊 Log disponibili in:"
echo "  - logs/gunicorn_access.log"
echo "  - logs/gunicorn_error.log"
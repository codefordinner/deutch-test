DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

git pull
npm install
npx prisma generate
# npx prisma db push --accept-data-loss # Отключено во избежание сброса и потери данных бд при обновлениях
sudo systemctl restart german-trainer.service
echo "Готово, обновилось"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

git pull
npm install
sudo systemctl restart german-trainer.service
echo "Готово, обновилось"
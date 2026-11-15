// Публикует dist/ в ветку gh-pages (GitHub Pages). Запуск: npm run build && npm run deploy
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
const run = (c, o = {}) => execSync(c, { stdio: 'inherit', ...o });
if (!existsSync('dist/index.html')) { console.error('Сначала: npm run build'); process.exit(1); }
const remote = execSync('git remote get-url origin').toString().trim();
writeFileSync('dist/.nojekyll', '');
const o = { cwd: 'dist' };
run('git init -q -b gh-pages', o);
run('git add -A', o);
run('git -c user.name="Abdulloh Zokirov" -c user.email="AbdullohZokirov@users.noreply.github.com" commit -q -m "Публикация сайта"', o);
run(`git push -f "${remote}" gh-pages`, o);
console.log('Готово: https://abdullohzokirov.github.io/portfolio/');

Publicación / Cómo compartir

- Sitio público (GitHub Pages): https://cariroja.github.io/turismoeduca

- Para actualizar rápidamente el sitio con los archivos en `public/` desde la raíz del repo:

```zsh
npx --yes gh-pages -d public
```

- Alternativa (para hacerlo repetible): instalar `gh-pages` y añadir un script `deploy` en `package.json`:

```zsh
npm install --save-dev gh-pages
npm pkg set homepage="https://cariroja.github.io/turismoeduca"
npm pkg set scripts.deploy="gh-pages -d public"
git add package.json package-lock.json
git commit -m "Add gh-pages deploy script"
npm run deploy
```

- Nota para quien visite el sitio: si en el mapa no aparecen las posiciones corregidas, pueden limpiar los overrides del navegador (DevTools → Console):

```javascript
localStorage.removeItem('pointOverrides');
location.reload();
```

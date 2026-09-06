# Nocturne Reliquary

Gothic crystal-keep tower defense. Castlevania-class atmosphere x Final Fantasy-class jobs, relics, and AP.

Original work. No Konami or Square Enix names, sprites, or music.

## Play

```bash
npm install
npm run dev
```

## On a phone

Hold the phone in landscape — the board is a 16:9 field, and portrait raises a
rotate prompt rather than shipping an unplayable sliver. Everything is driven by
taps: choose a job card, tap a socket to seat it, then tap a seated tower to open
its panel and spend AP. On desktop, keys `1`-`4` spend AP, `S` sells, `Space`
calls the next wave, `P` pauses and `F` fast-forwards.

Add it to the home screen for a fullscreen, landscape-locked launch — the web-app
manifest and icons ship with the build.

## Sharing a build

```bash
npm run build          # dist/ — a normal static site
npm run build:single   # dist/nocturne-reliquary.html — one self-contained file
```

Nothing is fetched at runtime: sprites are drawn procedurally and audio is
synthesised, so the single file plays straight off disk.

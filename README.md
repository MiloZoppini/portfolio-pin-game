# Portfolio Pin Game

Mini progetto Next.js creato da zero per costruire un puzzle stile "pull the pin" da usare nel portfolio.

## Avvio

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## File chiave

- `src/app/page.tsx`: landing del progetto con hero, prompt per Nano Banana e sezione demo.
- `src/components/PortfolioPinGame.tsx`: logica del puzzle, stato dei pin e UI del board.
- `src/app/globals.css`: tema visivo, board styling e animazioni base.

## Come personalizzarlo

1. Genera il tuo personaggio in PNG/WebP trasparente.
2. Sostituisci il placeholder nel bucket finale dentro `src/components/PortfolioPinGame.tsx`.
3. Cambia colori, testi e prompt per allineare il gioco al tuo stile visivo.

## Prompt iniziali per Nano Banana

- Personaggio: `Stylized game character, full body, soft 3D cartoon shading, confident pose, transparent background.`
- Stanza: `Whimsical puzzle room interior, blue and teal ambient lighting, cozy magical workshop, painterly 3D look.`
- Asset UI: `Game UI asset sheet with glowing golden idea orbs and pink glitch hazards, transparent background.`

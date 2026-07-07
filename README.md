# Pendulum Lab — Landing Page

The marketing/landing site for [Pendulum Lab](https://github.com/Elliot-Jung-17/pendulum-lab),
a validated chaotic-pendulum research laboratory that runs entirely in the browser.

- **Live app:** https://elliot-jung-17.github.io/pendulum-lab/
- **Landing (this site):** https://elliot-jung-17.github.io/pendulum-landing/
- **Reviewer console:** https://elliot-jung-17.github.io/pendulum-lab/reviewer.html

## Stack

Deliberately dependency-light: a single static `index.html` plus
`assets/landing.css`, `assets/main.js` (cursor spotlight, parallax/tilt,
magnetic buttons, GSAP ScrollTrigger choreography, count-up telemetry) and
`assets/scene.js` (a Three.js "order → chaos" hero sculpture that morphs a
luminous ribbon from an ordered ring into a baked chaotic double-pendulum
trajectory as you scroll). Three.js and GSAP load from CDNs; there is no build
step — open `index.html` or serve the folder statically.

The numbers on the page (959/959 unit tests, 12/12 integrator drift envelope,
~6e-14 SciPy DOP853 agreement, period-doubling onset 1.0664 vs the published
1.0663) are measured by the lab's own verification gates — see the main
repository's `reports/` directory and CI workflows.

## Development

```bash
# any static server works
npx serve .
```

MIT-licensed, same as the lab.

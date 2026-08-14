<!doctype html>
<html lang="{{ $locale }}" dir="{{ $direction }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    @if (!empty($seo['description']))
        <meta name="description" content="{{ $seo['description'] }}">
    @endif
    <style>
        :root { --brand: #0f766e; --ink: #0f172a; --muted: #64748b; --surface: #f8fafc; --card: #fff; }
        * { box-sizing: border-box; }
        body { margin: 0; color: var(--ink); background: var(--surface); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; }
        .container { width: min(1120px, calc(100% - 2rem)); margin-inline: auto; }
        .hero { color: #fff; background: linear-gradient(115deg, #0f172a, #134e4a); padding: 7rem 0; }
        .hero__grid { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 3rem; align-items: center; }
        .hero__eyebrow { color: #99f6e4; font-size: .85rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .hero h1 { margin: .6rem 0 1rem; max-width: 18ch; font-size: clamp(2.5rem, 6vw, 5.3rem); line-height: 1.02; }
        .hero p { max-width: 56ch; color: #ccfbf1; font-size: 1.15rem; }
        .button { display: inline-block; margin-top: 1.25rem; padding: .8rem 1.1rem; color: #042f2e; background: #99f6e4; border-radius: .5rem; text-decoration: none; font-weight: 800; }
        .hero__panel { padding: 1.4rem; border: 1px solid rgba(255,255,255,.22); border-radius: 1rem; background: rgba(255,255,255,.08); backdrop-filter: blur(8px); }
        .section { padding: 5rem 0; }
        .section h2 { font-size: clamp(1.8rem, 4vw, 3rem); margin: 0 0 2rem; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .card { padding: 1.4rem; border: 1px solid #e2e8f0; border-radius: .9rem; background: var(--card); }
        .card h3 { margin-top: 0; }
        .card p { margin-bottom: 0; color: var(--muted); }
        @media (max-width: 760px) { .hero { padding: 4.5rem 0; } .hero__grid, .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
<main>
    @foreach ($blocks as $block)
        @include($block['view'], ['block' => $block, 'locale' => $locale, 'direction' => $direction])
    @endforeach
</main>
</body>
</html>

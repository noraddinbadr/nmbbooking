@php
    $title = (string) data_get($block, 'props.title', '');
    $subtitle = (string) data_get($block, 'props.subtitle', '');
    $ctaLabel = (string) data_get($block, 'props.cta.label', '');
    $ctaHref = (string) data_get($block, 'props.cta.href', '/');
@endphp

<section class="hero" data-component="{{ $block['componentKey'] }}" data-component-version="{{ $block['componentVersion'] }}">
    <div class="container hero__grid">
        <div>
            <div class="hero__eyebrow">{{ $block['variant'] ?? 'standard' }}</div>
            <h1>{{ $title }}</h1>
            @if ($subtitle !== '')
                <p>{{ $subtitle }}</p>
            @endif
            @if ($ctaLabel !== '')
                <a class="button" href="{{ $ctaHref }}">{{ $ctaLabel }}</a>
            @endif
        </div>
        <aside class="hero__panel" aria-label="{{ $locale === 'ar' ? 'معلومات الموقع' : 'Site information' }}">
            <strong>{{ $locale === 'ar' ? 'صفحة منشورة ديناميكيًا' : 'Dynamically published page' }}</strong>
            <p>{{ $locale === 'ar' ? 'يُقرأ المحتوى من إصدار منشور ومكوّن متحقق منه.' : 'Content is read from a published revision and a validated component.' }}</p>
        </aside>
    </div>
</section>

@php
    $heading = (string) data_get($block, 'props.heading', '');
    $limit = (int) data_get($block, 'props.limit', 6);
@endphp

<section class="section" data-component="{{ $block['componentKey'] }}" data-component-version="{{ $block['componentVersion'] }}">
    <div class="container">
        @if ($heading !== '')
            <h2>{{ $heading }}</h2>
        @endif
        <div class="card">
            <strong>{{ $locale === 'ar' ? 'مكوّن مشروعات مفعل بالحزمة' : 'Package-enabled projects component' }}</strong>
            <p>{{ $locale === 'ar' ? "سيعرض هذا المكوّن المشروعات المنشورة حتى حد {$limit} عند تنفيذ وحدة المقاولات." : "This component will render up to {$limit} published projects when the construction module is implemented." }}</p>
        </div>
    </div>
</section>

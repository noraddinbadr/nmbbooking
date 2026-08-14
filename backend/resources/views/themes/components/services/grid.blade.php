@php
    $heading = (string) data_get($block, 'props.heading', '');
    $items = (array) data_get($block, 'props.items', []);
@endphp

<section class="section" data-component="{{ $block['componentKey'] }}" data-component-version="{{ $block['componentVersion'] }}">
    <div class="container">
        @if ($heading !== '')
            <h2>{{ $heading }}</h2>
        @endif
        <div class="grid">
            @foreach ($items as $item)
                <article class="card">
                    <h3>{{ (string) data_get($item, 'title', '') }}</h3>
                    @if (data_get($item, 'summary'))
                        <p>{{ (string) data_get($item, 'summary') }}</p>
                    @endif
                </article>
            @endforeach
        </div>
    </div>
</section>

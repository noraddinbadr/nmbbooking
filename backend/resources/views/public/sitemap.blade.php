<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($pages as $page)
    <url>
        <loc>{{ $baseUrl }}{{ $page->route_path }}</loc>
        <lastmod>{{ $page->updated_at->utc()->format('Y-m-d\TH:i:s\Z') }}</lastmod>
    </url>
@endforeach
</urlset>

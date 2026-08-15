@extends(backpack_view('blank'))

@section('content')
    <div class="container-fluid" dir="rtl">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h1 class="mb-1">Marketplace الحزم</h1>
                <p class="text-muted mb-0">الكتالوج المركزي المتحقق للحزم المتاحة في المنصة. لا تنفذ هذه الصفحة أي تفعيل أو تنزيل أو ترحيل.</p>
            </div>
            <a class="btn btn-outline-secondary" href="{{ route('platform.dashboard') }}">العودة إلى تشغيل المنصة</a>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-6 col-xl-3">
                <div class="card"><div class="card-body"><small class="text-muted">إجمالي الحزم</small><div class="fs-2 fw-bold">{{ $packages->count() }}</div></div></div>
            </div>
            <div class="col-md-6 col-xl-3">
                <div class="card"><div class="card-body"><small class="text-muted">حزم الموقع</small><div class="fs-2 fw-bold">{{ $packages->where('scope', 'site')->count() }}</div></div></div>
            </div>
            <div class="col-md-6 col-xl-3">
                <div class="card"><div class="card-body"><small class="text-muted">حزم العميل</small><div class="fs-2 fw-bold">{{ $packages->where('scope', 'tenant')->count() }}</div></div></div>
            </div>
            <div class="col-md-6 col-xl-3">
                <div class="card"><div class="card-body"><small class="text-muted">حزم قطاعية</small><div class="fs-2 fw-bold">{{ $packages->where('category', 'sector')->count() }}</div></div></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><strong>كتالوج الحزم</strong></div>
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>الحزمة</th>
                            <th>الفئة / النطاق</th>
                            <th>السياسة</th>
                            <th>الاعتماديات</th>
                            <th>القدرات</th>
                            <th>التوافق</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($packages as $package)
                            <tr>
                                <td>
                                    <div class="fw-semibold">{{ $package['displayName']['ar'] }}</div>
                                    <div class="small text-muted">{{ $package['displayName']['en'] }}</div>
                                    <code>{{ $package['key'] }}@{{ $package['version'] }}</code>
                                </td>
                                <td><span class="badge bg-secondary">{{ $package['category'] }}</span> <span class="badge bg-light text-dark">{{ $package['scope'] }}</span></td>
                                <td><code>{{ $package['disablePolicy'] }}</code></td>
                                <td>{{ $package['dependencyCount'] }} اعتمادية / {{ $package['conflictCount'] }} تعارض</td>
                                <td class="small">
                                    @foreach ($package['capabilityCounts'] as $type => $count)
                                        <span class="d-inline-block me-2"><code>{{ $type }}</code>: {{ $count }}</span>
                                    @endforeach
                                </td>
                                <td class="small text-nowrap">
                                    @foreach ($package['compatibility'] as $runtime => $constraint)
                                        <div><code>{{ $runtime }}</code> {{ $constraint }}</div>
                                    @endforeach
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="6" class="text-center text-muted py-4">لا توجد حزم مدرجة في الكتالوج.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection

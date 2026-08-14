@extends(backpack_view('blank'))

@section('content')
    <div class="container-fluid">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h1 class="mb-1">تشغيل المنصة</h1>
                <p class="text-muted mb-0">لوحة مركزية لمراقبة العملاء والحزم وقواعد البيانات.</p>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-6 col-xl"><div class="card"><div class="card-body"><small class="text-muted">عملاء نشطون</small><div class="fs-2 fw-bold">{{ $metrics['activeTenants'] }}</div></div></div></div>
            <div class="col-md-6 col-xl"><div class="card"><div class="card-body"><small class="text-muted">قيد الإنشاء</small><div class="fs-2 fw-bold">{{ $metrics['provisioningTenants'] }}</div></div></div></div>
            <div class="col-md-6 col-xl"><div class="card"><div class="card-body"><small class="text-muted">قواعد جاهزة</small><div class="fs-2 fw-bold">{{ $metrics['readyTenantDatabases'] }}</div></div></div></div>
            <div class="col-md-6 col-xl"><div class="card"><div class="card-body"><small class="text-muted">حزم مفعلة في الكتالوج</small><div class="fs-2 fw-bold">{{ $metrics['activePackageVersions'] }}</div></div></div></div>
            <div class="col-md-6 col-xl"><div class="card border-danger"><div class="card-body"><small class="text-muted">فشل Provisioning</small><div class="fs-2 fw-bold text-danger">{{ $metrics['failedProvisioningRuns'] }}</div></div></div></div>
        </div>

        <div class="card">
            <div class="card-header"><strong>أحدث أحداث المنصة</strong></div>
            <div class="table-responsive">
                <table class="table table-striped table-hover mb-0">
                    <thead><tr><th>الوقت</th><th>الحدث</th><th>Tenant</th><th>الموضوع</th></tr></thead>
                    <tbody>
                        @forelse ($recentEvents as $event)
                            <tr>
                                <td>{{ $event->created_at }}</td>
                                <td><code>{{ $event->event_key }}</code></td>
                                <td>{{ $event->tenant_id ?? '—' }}</td>
                                <td>{{ $event->subject_type ? $event->subject_type.':'.$event->subject_public_id : '—' }}</td>
                            </tr>
                        @empty
                            <tr><td colspan="4" class="text-center text-muted py-4">لا توجد أحداث مسجلة بعد.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection

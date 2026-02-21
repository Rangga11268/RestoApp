<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Penjualan</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            padding: 32px;
        }

        h1 {
            font-size: 20px;
            font-weight: 700;
            color: #ea580c;
            margin-bottom: 2px;
        }

        .meta {
            font-size: 10px;
            color: #555;
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #ea580c;
            border-bottom: 2px solid #ea580c;
            padding-bottom: 4px;
            margin-bottom: 10px;
            margin-top: 20px;
        }

        /* Summary cards */
        .cards {
            display: table;
            width: 100%;
            border-spacing: 8px;
            margin-bottom: 6px;
        }

        .card {
            display: table-cell;
            width: 33%;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 10px 14px;
            text-align: center;
        }

        .card .val {
            font-size: 16px;
            font-weight: 700;
            color: #ea580c;
        }

        .card .lbl {
            font-size: 9px;
            color: #777;
            margin-top: 2px;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }

        thead th {
            background: #ea580c;
            color: #fff;
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
        }

        tbody tr:nth-child(even) {
            background: #fff7ed;
        }

        tbody td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .footer {
            margin-top: 28px;
            font-size: 9px;
            color: #999;
            text-align: right;
        }
    </style>
</head>

<body>

    <h1>Laporan Penjualan</h1>
    <p class="meta">
        {{ $restaurantName }} &nbsp;|&nbsp; Periode: {{ $from }} s/d {{ $to }}
        &nbsp;|&nbsp; Dicetak: {{ $printedAt }}
    </p>

    {{-- Summary --}}
    <div class="section-title">Ringkasan</div>
    <div class="cards">
        <div class="card">
            <div class="val">Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</div>
            <div class="lbl">Total Pendapatan</div>
        </div>
        <div class="card">
            <div class="val">{{ $summary['total_transactions'] }}</div>
            <div class="lbl">Total Transaksi</div>
        </div>
        <div class="card">
            <div class="val">Rp {{ number_format($summary['avg_per_day'], 0, ',', '.') }}</div>
            <div class="lbl">Rata-rata/Hari</div>
        </div>
    </div>

    {{-- Sales chart table --}}
    <div class="section-title">Tren Penjualan</div>
    <table>
        <thead>
            <tr>
                <th>Periode</th>
                <th class="text-right">Pendapatan</th>
                <th class="text-right">Transaksi</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($chart as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td class="text-right">Rp {{ number_format($row['revenue'], 0, ',', '.') }}</td>
                    <td class="text-right">{{ $row['transactions'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Top Products --}}
    @if (count($topProducts))
        <div class="section-title">Produk Terlaris</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nama Menu</th>
                    <th class="text-right">Qty Terjual</th>
                    <th class="text-right">Total Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($topProducts as $i => $p)
                    <tr>
                        <td class="text-center">{{ $i + 1 }}</td>
                        <td>{{ $p['name'] }}</td>
                        <td class="text-right">{{ $p['total_qty'] }}</td>
                        <td class="text-right">Rp {{ number_format($p['total_revenue'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- Staff performance --}}
    @if (count($staffPerformance))
        <div class="section-title">Performa Staf</div>
        <table>
            <thead>
                <tr>
                    <th>Nama Staf</th>
                    <th class="text-right">Total Pesanan</th>
                    <th class="text-right">Total Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($staffPerformance as $s)
                    <tr>
                        <td>{{ $s['cashier_name'] }}</td>
                        <td class="text-right">{{ $s['total_orders'] }}</td>
                        <td class="text-right">Rp {{ number_format($s['total_revenue'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <p class="footer">Laporan dibuat otomatis oleh RestoApp</p>

</body>

</html>

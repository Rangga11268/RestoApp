<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;

class SalesReportExport implements FromArray, WithHeadings, WithTitle, WithStyles, ShouldAutoSize, WithColumnFormatting
{
    protected array $rows;
    protected string $restaurantName;
    protected string $from;
    protected string $to;

    public function __construct(array $rows, string $restaurantName, string $from, string $to)
    {
        $this->rows           = $rows;
        $this->restaurantName = $restaurantName;
        $this->from           = $from;
        $this->to             = $to;
    }

    public function array(): array
    {
        return array_map(fn($r) => [
            $r['label'],
            $r['revenue'],
            $r['transactions'],
        ], $this->rows);
    }

    public function headings(): array
    {
        return ['Periode', 'Pendapatan (IDR)', 'Jumlah Transaksi'];
    }

    public function title(): string
    {
        return 'Laporan Penjualan';
    }

    public function styles(Worksheet $sheet): array
    {
        // Bold heading row
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'B' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'C' => NumberFormat::FORMAT_NUMBER,
        ];
    }
}

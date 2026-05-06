import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from './dashboard.service';

@Component({
    selector     : 'app-dashboard',
    standalone   : true,
    encapsulation: ViewEncapsulation.None,
    imports      : [
        CommonModule,
        MatButtonModule, MatIconModule, MatProgressSpinnerModule,
        RouterLink, NgApexchartsModule,
    ],
    templateUrl  : './dashboard.component.html',
})
export class DashboardComponent implements OnInit
{
    loading  = true;
    summary: any = null;
    monthly: any[] = [];

    donut: any = null;
    bar: any   = null;

    constructor(private _service: DashboardService) {}

    ngOnInit(): void
    {
        this._service.getDebtReport().subscribe({
            next : (res) =>
            {
                this.summary = res.summary;
                this.monthly = res.monthly ?? [];
                this._buildCharts();
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    get collectionPct(): number
    {
        if (!this.summary || !this.summary.total_amount) { return 0; }
        return Math.round(this.summary.total_paid / this.summary.total_amount * 100);
    }

    private _buildCharts(): void
    {
        const s = this.summary;

        this.donut = {
            series     : [s.unpaid_count, s.partial_count, s.paid_count],
            chart      : { type: 'donut', height: 260, fontFamily: 'Inter, sans-serif', animations: { enabled: true } },
            labels     : ['Unpaid', 'Partial', 'Paid'],
            colors     : ['#ef4444', '#f59e0b', '#22c55e'],
            legend     : { position: 'bottom', fontFamily: 'Inter, sans-serif', fontSize: '13px' },
            stroke     : { width: 2, colors: ['#fff'] },
            plotOptions: {
                pie: {
                    donut: {
                        size  : '70%',
                        labels: {
                            show : true,
                            total: { show: true, label: 'Total', fontSize: '14px', fontWeight: 600, formatter: () => String(s.total_debts) },
                            value: { fontSize: '22px', fontWeight: 700 },
                        },
                    },
                },
            },
            dataLabels : { enabled: false },
            tooltip    : { y: { formatter: (v: number) => `${v} ta` } },
        };

        const labels = this.monthly.map(m => m.month);
        this.bar = {
            series    : [
                { name: 'Total',     data: this.monthly.map(m => m.total) },
                { name: 'Paid',      data: this.monthly.map(m => m.paid) },
                { name: 'Remaining', data: this.monthly.map(m => m.remaining) },
            ],
            chart     : { type: 'bar', height: 260, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
            colors    : ['#6366f1', '#22c55e', '#ef4444'],
            fill      : { opacity: 0.9 },
            stroke    : { show: true, width: 2, colors: ['transparent'] },
            xaxis     : { categories: labels.length ? labels : ['No data'], labels: { style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' } } },
            yaxis     : { labels: { style: { fontSize: '12px' }, formatter: (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(v) } },
            grid      : { borderColor: '#f1f5f9', strokeDashArray: 4 },
            dataLabels: { enabled: false },
            legend    : { position: 'top', fontFamily: 'Inter, sans-serif', fontSize: '13px' },
            tooltip   : { y: { formatter: (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' UZS' } },
        };
    }
}

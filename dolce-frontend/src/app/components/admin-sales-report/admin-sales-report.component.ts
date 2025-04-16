// ✅ admin-sales-report.component.ts (Updated)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChartType, ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-admin-sales-report',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './admin-sales-report.component.html',
  styleUrls: ['./admin-sales-report.component.css']
})
export class AdminSalesReportComponent implements OnInit {
  dailySales = 0;
  weeklySales = 0;
  monthlySales = 0;
  bestSelling: { name: string, total_sales: number }[] = [];
  startDate: string = '';
  endDate: string = '';

  barChartData: ChartData<'bar'> = {
    labels: ['Daily', 'Weekly', 'Monthly'],
    datasets: [
      { data: [0, 0, 0], label: 'Sales (RM)' }
    ]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
  };

  barChartType: 'bar' = 'bar';

  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      { data: [] }
    ]
  };

  pieChartType: 'pie' = 'pie';
  

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSalesData();
  }

  fetchSalesData(): void {
    this.http.get<any>('http://localhost:5000/api/reports').subscribe({
      next: (data) => {
        this.dailySales = Number(data.daily) || 0;
        this.weeklySales = Number(data.weekly) || 0;
        this.monthlySales = Number(data.monthly) || 0;

        this.bestSelling = (data.bestSelling || []).map((item: any) => ({
          name: item.name,
          total_sales: Number(item.total_sales)
        }));        

        this.barChartData = {
          labels: ['Daily', 'Weekly', 'Monthly'],
          datasets: [
            {
              data: [this.dailySales, this.weeklySales, this.monthlySales],
              label: 'Sales (RM)'
            }
          ]
        };

        this.pieChartData = {
          labels: this.bestSelling.map(item => item.name),
          datasets: [
            { data: this.bestSelling.map(item => item.total_sales) }
          ]
        };
      },
      error: (err) => console.error('Error fetching report:', err)
    });
  }

  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Sales Trend (RM)' }
    ]
  };
  
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: true }
    }
  };
  
  lineChartType: 'line' = 'line';
  
  fetchSalesTrend(): void {
    if (!this.startDate || !this.endDate) return;
  
    this.http.get<any[]>(`http://localhost:5000/api/reports/trend?start=${this.startDate}&end=${this.endDate}`).subscribe({
      next: (data) => {
        this.lineChartData = {
          labels: data.map(d => d.date),
          datasets: [
            { data: data.map(d => +d.total), label: 'Sales Trend (RM)' }
          ]
        };
      },
      error: (err) => console.error('Failed to fetch trend', err)
    });
  }

  exportToCSV(): void {
    const salesData = [
      { Type: 'Daily', Amount: this.dailySales },
      { Type: 'Weekly', Amount: this.weeklySales },
      { Type: 'Monthly', Amount: this.monthlySales }
    ];
  
    const bestSellers = this.bestSelling.map(item => ({
      Item: item.name,
      Sales: item.total_sales
    }));
  
    const worksheet1 = XLSX.utils.json_to_sheet(salesData);
    const worksheet2 = XLSX.utils.json_to_sheet(bestSellers);
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Sales Summary');
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Best Sellers');
  
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  
  exportToPDF(): void {
    this.toggleExportMode(true);
  
    setTimeout(() => {
      const content = document.getElementById('reportContent');
      if (!content) return;
  
      html2canvas(content).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        this.toggleExportMode(false);
      });
    }, 300); // wait for animations/layout to settle
  }
  

  toggleExportMode(active: boolean): void {
    const content = document.getElementById('reportContent');
    if (content) {
      if (active) {
        content.classList.add('export-mode');
      } else {
        content.classList.remove('export-mode');
      }
    }
  }  
  
}

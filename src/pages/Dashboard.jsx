import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ utilization_rate: 0, total_projects: 0, total_revenue_forecast: 0 });

  useEffect(() => {
    // 実際はAPIから取得
    axios.get(`${API_URL}/stats`).then(res => setStats(res.data)).catch(err => console.error(err));
  }, []);

  const doughnutData = {
    labels: ['稼働', '待機'],
    datasets: [{
      data: [stats.utilization_rate, 100 - stats.utilization_rate],
      backgroundColor: ['#4caf50', '#e0e0e0'],
    }]
  };

  const barData = {
    labels: ['10月', '11月', '12月'],
    datasets: [{
      label: '売上予測 (万円)',
      data: [1200, 1350, 1100],
      backgroundColor: '#1976d2',
    }]
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>ダッシュボード</Typography>
      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">全社稼働率</Typography>
            <Typography variant="h3" color="primary">{stats.utilization_rate}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">進行中案件数</Typography>
            <Typography variant="h3">{stats.total_projects}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">今期売上見込</Typography>
            <Typography variant="h3">{stats.total_revenue_forecast}万</Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6">稼働状況</Typography>
            <Box sx={{ height: '200px', width: '200px' }}>
              <Doughnut data={doughnutData} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '300px' }}>
            <Typography variant="h6">売上推移</Typography>
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

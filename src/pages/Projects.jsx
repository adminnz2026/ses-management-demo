import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, LinearProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Projects() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', client: '', period: '', budget: 0, status: '進行中'
  });

  const fetchProjects = () => {
    axios.get(`${API_URL}/projects`)
      .then(res => setRows(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ name: '', client: '', period: '', budget: 0, status: '進行中' });
    setOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditMode(true);
    setCurrentId(row.id);
    setFormData({
      name: row.name, client: row.client, period: row.period || '',
      budget: row.budget, status: row.status
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('削除できませんでした（アサインが存在する可能性があります）');
    }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_URL}/projects/${currentId}`, formData);
      } else {
        await axios.post(`${API_URL}/projects`, formData);
      }
      setOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'name', headerName: '案件名', width: 200 },
    { field: 'client', headerName: '顧客', width: 130 },
    { field: 'period', headerName: '期間', width: 150 },
    { field: 'budget', headerName: '予算(万)', width: 100 },
    { field: 'status', headerName: '状態', width: 100 },
    {
      field: 'progress', headerName: '消化率(仮)', width: 120,
      renderCell: () => <Box sx={{ width: '100%' }}><LinearProgress variant="determinate" value={Math.random() * 100} /></Box>
    },
    {
      field: 'actions', headerName: '管理', width: 120, sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenEdit(params.row)}><EditIcon /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h4">案件・契約管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>案件登録</Button>
      </Stack>
      <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editMode ? '案件編集' : '案件登録'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 350 }}>
            <TextField label="案件名" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <TextField label="顧客名" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
            <TextField label="期間 (例: 2023/04 - 2024/03)" value={formData.period} onChange={(e) => setFormData({...formData, period: e.target.value})} />
            <TextField label="予算 (万円)" type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})} />
            <TextField select label="ステータス" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <MenuItem value="進行中">進行中</MenuItem>
              <MenuItem value="準備中">準備中</MenuItem>
              <MenuItem value="完了">完了</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
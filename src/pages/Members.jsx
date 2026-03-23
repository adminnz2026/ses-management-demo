import React, { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Box, Typography, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, List, ListItem,
  ListItemText, ListItemSecondaryAction, Tooltip, Rating, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings'; // 設定用アイコン
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Members() {
  const [rows, setRows] = useState([]);
  const [fieldSettings, setFieldSettings] = useState([]); // カスタム項目定義

  // モーダル制御
  const [open, setOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false); // 項目設定モーダル

  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // フォームデータ
  const [formData, setFormData] = useState({
    name: '', role: '', status: '稼働中', skills: '', price: 0,
    job_history: '', qualifications: '', evaluation: 3,
    custom_fields: {} // 動的データ用
  });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  // 設定用フォーム
  const [newField, setNewField] = useState({ key: '', label: '' });

  // 初期データロード
  const fetchData = async () => {
    try {
      const [resMembers, resSettings] = await Promise.all([
        axios.get(`${API_URL}/members`),
        axios.get(`${API_URL}/settings/fields`)
      ]);
      setRows(resMembers.data);
      setFieldSettings(resSettings.data);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const hiddenModel = {};

    // カスタム項目定義をループして、それらだけを false (非表示) に設定
    fieldSettings.forEach(setting => {
      hiddenModel[`custom_${setting.field_key}`] = false;
    });
    // 標準カラム（役割、スキル等）はこの hiddenModel に含まれないため、デフォルトで表示されます
    setColumnVisibilityModel(hiddenModel);
  }, [fieldSettings]);

  // --- CRUD操作 ---

  const handleOpenAdd = () => {
    setEditMode(false);
    // custom_fields も初期化
    setFormData({
      name: '', role: '', status: '稼働中', skills: '', price: 0,
      job_history: '', qualifications: '', evaluation: 3,
      custom_fields: {}
    });
    setOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditMode(true);
    setCurrentId(row.id);
    setFormData({
      ...row,
      // DBからnullで来る可能性があるので空オブジェクトでガード
      custom_fields: row.custom_fields || {}
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (editMode) {
        await axios.put(`${API_URL}/members/${currentId}`, payload);
      } else {
        await axios.post(`${API_URL}/members`, payload);
      }
      setOpen(false);
      fetchData();
    } catch (err) { alert('保存失敗'); }
  };

  const handleDelete = async (id) => { /* 省略（既存通り） */ };
  const handleDownload = (id) => { window.open(`${API_URL}/members/${id}/download`, '_blank'); };

  // --- 項目設定の操作 ---

  const handleAddField = async () => {
    if (!newField.key || !newField.label) return alert("キーと表示名を入力してください");
    try {
      await axios.post(`${API_URL}/settings/fields`, {
        field_key: newField.key,
        label: newField.label,
        field_type: 'text'
      });
      setNewField({ key: '', label: '' });
      fetchData(); // 設定再読込
    } catch (err) { alert('項目追加失敗'); }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm("この項目定義を削除しますか？(データは残りますが表示されなくなります)")) return;
    await axios.delete(`${API_URL}/settings/fields/${id}`);
    fetchData();
  };

  // --- カラム定義 ---

  // src/pages/Members.jsx

  // 1. 固定カラム (標準項目)
  const fixedColumns = [
    { field: 'name', headerName: '氏名', width: 130 },
    { field: 'role', headerName: '役割', width: 80 },
    {
      field: 'status',
      headerName: 'ステータス',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === '稼働中' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'skills',
      headerName: 'スキル',
      width: 200,
      renderCell: (params) => {
        const skills = params.value ? String(params.value).split(',') : [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {skills.map((skill, idx) => (
              <Chip key={idx} label={skill.trim()} variant="outlined" size="small" />
            ))}
          </Box>
        );
      }
    },
    { field: 'price', headerName: '単価(万)', width: 90 },
    {
        field: 'job_history', headerName: '職歴詳細', width: 150,
        renderCell: (params) => (
            <Tooltip title={<div style={{ whiteSpace: 'pre-wrap' }}>{params.value}</div>} arrow>
                <Typography noWrap variant="body2" sx={{ cursor: 'pointer' }}>
                    {params.value}
                </Typography>
            </Tooltip>
        )
    },
    { field: 'qualifications', headerName: '保有資格', width: 120 },
    {
        field: 'evaluation', headerName: '評価', width: 140,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={params.value} readOnly size="small" />
            </Box>
        )
    },
  ];

  // 2. 動的カラム (カスタム項目)
  const dynamicColumns = fieldSettings.map(setting => ({
    field: `custom_${setting.field_key}`,
    headerName: setting.label,
    width: 120,
    valueGetter: (params) => {
      const fields = params.row.custom_fields || {};
      return fields[setting.field_key] || '';
    }
  }));

  // 3. 操作カラム (ここが編集ボタンです)
  const actionColumn = {
    field: 'actions',
    headerName: '操作',
    width: 150,
    sortable: false, // ソート不可にする
    renderCell: (params) => (
      <Box>
         {/* Excelダウンロード */}
         <IconButton color="primary" onClick={() => handleDownload(params.row.id)} title="スキルシート出力">
            <DownloadIcon />
          </IconButton>
         {/* 編集ボタン */}
         <IconButton size="small" onClick={() => handleOpenEdit(params.row)} title="編集">
            <EditIcon fontSize="small" />
         </IconButton>
         {/* 削除ボタン */}
         <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)} title="削除">
            <DeleteIcon fontSize="small" />
         </IconButton>
      </Box>
    )
  };

  // 全てのカラムを結合
  const columns = [...fixedColumns, ...dynamicColumns, actionColumn];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h4">要員管理</Typography>
        <Box>
          <Button startIcon={<SettingsIcon />} onClick={() => setOpenSettings(true)} sx={{ mr: 1 }}>
            項目設定
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            新規登録
          </Button>
        </Box>
      </Stack>

      <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }}
       slotProps={{
                 toolbar: {
                   showQuickFilter: true, // クイック検索バーを表示
                   quickFilterProps: { debounceMs: 500 },
                 },
               }}
       columnVisibilityModel={columnVisibilityModel}
       onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
       />

      {/* メンバー登録/編集ダイアログ */}
	<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
	  <DialogTitle>{editMode ? 'メンバー編集' : 'メンバー登録'}</DialogTitle>
	  <DialogContent>
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 1 }}>

		  {/* === 左カラム: 基本情報 & カスタム項目 === */}
		  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			  {/* 1. 基本固定項目 */}
			  <TextField
				  label="氏名"
				  value={formData.name}
				  onChange={(e) => setFormData({...formData, name: e.target.value})}
				  fullWidth
				  required
			  />

			  <TextField
				  label="役割 (例: SE, PM)"
				  value={formData.role}
				  onChange={(e) => setFormData({...formData, role: e.target.value})}
				  fullWidth
			  />

			  <TextField
                select
                label="ステータス"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                fullWidth
                // 稼働中・待機中は自動設定のため、手動変更は「離任」のみ許可する、あるいは完全自動にする
                // ここでは「稼働中/待機中」の場合はロックし、説明を表示するパターンにします
                disabled={formData.status !== '離任'}
                helperText={formData.status === '離任' ? '退職時は手動で選択' : 'アサイン状況により自動判定されます'}
              >
                <MenuItem value="稼働中">稼働中</MenuItem>
                <MenuItem value="待機中">待機中</MenuItem>
                <MenuItem value="離任">離任</MenuItem>
              </TextField>

			  <TextField
				  label="単価 (万円)"
				  type="number"
				  value={formData.price}
				  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
				  fullWidth
			  />

			  <TextField
				  label="スキル (カンマ区切り)"
				  value={formData.skills}
				  onChange={(e) => setFormData({...formData, skills: e.target.value})}
				  fullWidth
				  helperText="例: Java, AWS, React"
			  />

			  {/* 2. カスタム項目 (動的生成) */}
			  {fieldSettings.length > 0 && (
				  <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
					  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
						  カスタム項目
					  </Typography>
					  <Stack spacing={2}>
						  {fieldSettings.map(setting => (
							  <TextField
								  key={setting.id}
								  label={setting.label}
								  value={formData.custom_fields[setting.field_key] || ''}
								  onChange={(e) => {
									  const newCustom = { ...formData.custom_fields, [setting.field_key]: e.target.value };
									  setFormData({ ...formData, custom_fields: newCustom });
								  }}
								  fullWidth
								  size="small"
							  />
						  ))}
					  </Stack>
				  </Box>
			  )}
		  </Box>

		  {/* === 右カラム: 詳細情報 (資格・評価・経歴) === */}
		  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

			  <TextField
				  label="保有資格"
				  value={formData.qualifications}
				  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
				  fullWidth
				  placeholder="AWS SAA, 応用情報, PMP..."
			  />

			  <Box>
				  <Typography component="legend" variant="caption">社内評価</Typography>
				  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					  <Rating
						  value={formData.evaluation}
						  onChange={(event, newValue) => {
							  setFormData({...formData, evaluation: newValue});
						  }}
					  />
					  <Typography variant="body2" color="textSecondary">
						  {/* 簡易的に数字、または labelsマップがあればそれを使用 */}
						  Level {formData.evaluation}
					  </Typography>
				  </Box>
			  </Box>

			  <TextField
				  label="職務経歴 (詳細)"
				  value={formData.job_history}
				  onChange={(e) => setFormData({...formData, job_history: e.target.value})}
				  fullWidth
				  multiline
				  rows={12}
				  placeholder="【プロジェクト名】〇〇システム開発&#13;&#10;【期間】2020/04 - 2022/03&#13;&#10;【詳細】Javaを用いた..."
				  sx={{ flexGrow: 1 }}
			  />
		  </Box>
		</Box>
	  </DialogContent>
	  <DialogActions>
		<Button onClick={() => setOpen(false)}>キャンセル</Button>
		<Button onClick={handleSave} variant="contained">保存</Button>
	  </DialogActions>
	</Dialog>

      {/* 項目設定ダイアログ */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)}>
        <DialogTitle>カスタム項目の管理</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
            <TextField label="項目キー (英数字)" placeholder="github_url" size="small" value={newField.key} onChange={e => setNewField({...newField, key: e.target.value})} />
            <TextField label="表示名" placeholder="GitHub URL" size="small" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} />
            <Button variant="contained" onClick={handleAddField}>追加</Button>
          </Box>
          <List>
            {fieldSettings.map(fs => (
                <ListItem key={fs.id} divider>
                    <ListItemText primary={fs.label} secondary={`Key: ${fs.field_key}`} />
                    <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeleteField(fs.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}